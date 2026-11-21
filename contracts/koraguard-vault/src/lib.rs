#![no_std]

// EXPERIMENTAL TESTNET-ONLY CONTRACT.
// This code is not audited, deployed, or integrated with the web UI.
// There are no upgrade/admin capabilities in this first design.

use soroban_sdk::{contract, contractimpl, contracttype, token::TokenClient, Address, Env};

#[contracttype]
#[derive(Clone)]
pub enum Key {
    Token,
    Balance(Address),
    Reserved(Address),
    Commitment(Address, u64),
}

#[contracttype]
#[derive(Clone)]
pub struct Promise {
    pub recipient: Address,
    pub amount: i128,
}

#[contract]
pub struct KoraGuardVault;

fn stored(env: &Env, key: &Key) -> i128 {
    env.storage().persistent().get(key).unwrap_or(0)
}

fn persist(env: &Env, key: &Key, value: i128) {
    env.storage().persistent().set(key, &value);
    env.storage().persistent().extend_ttl(key, 100_000, 500_000);
}

fn token_client(env: &Env) -> TokenClient<'_> {
    let token: Address = env.storage().instance().get(&Key::Token).expect("token not set");
    TokenClient::new(env, &token)
}

fn positive(amount: i128) {
    assert!(amount > 0, "amount must be positive");
}

fn available(env: &Env, owner: &Address) -> i128 {
    let total = stored(env, &Key::Balance(owner.clone()));
    let reserved = stored(env, &Key::Reserved(owner.clone()));
    total.checked_sub(reserved).expect("corrupt vault balance")
}

#[contractimpl]
impl KoraGuardVault {
    pub fn __constructor(env: Env, token: Address) {
        env.storage().instance().set(&Key::Token, &token);
        env.storage().instance().extend_ttl(100_000, 500_000);
    }

    /// Move tokens INTO this contract; nothing is custodially held by the web app.
    pub fn deposit(env: Env, owner: Address, amount: i128) {
        positive(amount);
        owner.require_auth();
        let balance_key = Key::Balance(owner.clone());
        let updated = stored(&env, &balance_key).checked_add(amount).expect("overflow");
        token_client(&env).transfer(&owner, &env.current_contract_address(), &amount);
        persist(&env, &balance_key, updated);
    }

    /// Reserve existing deposits for exactly one recipient. This reserve cannot be withdrawn.
    pub fn commit(env: Env, owner: Address, id: u64, recipient: Address, amount: i128) {
        positive(amount);
        owner.require_auth();
        let commitment_key = Key::Commitment(owner.clone(), id);
        assert!(!env.storage().persistent().has(&commitment_key), "id already used");
        assert!(available(&env, &owner) >= amount, "insufficient unreserved funds");
        let reserved_key = Key::Reserved(owner);
        let new_reserved = stored(&env, &reserved_key).checked_add(amount).expect("overflow");
        persist(&env, &reserved_key, new_reserved);
        env.storage().persistent().set(&commitment_key, &Promise { recipient, amount });
        env.storage().persistent().extend_ttl(&commitment_key, 100_000, 500_000);
    }

    /// Owner-approved settlement pays the fixed recipient, never an arbitrary caller.
    pub fn pay(env: Env, owner: Address, id: u64) {
        owner.require_auth();
        let commitment_key = Key::Commitment(owner.clone(), id);
        let promise: Promise = env.storage().persistent().get(&commitment_key).expect("unknown commitment");
        let balance_key = Key::Balance(owner.clone());
        let reserved_key = Key::Reserved(owner);
        let new_balance = stored(&env, &balance_key).checked_sub(promise.amount).expect("corrupt balance");
        let new_reserved = stored(&env, &reserved_key).checked_sub(promise.amount).expect("corrupt reserve");
        // Update storage before external token call; a failed transfer reverts the invocation.
        persist(&env, &balance_key, new_balance);
        persist(&env, &reserved_key, new_reserved);
        env.storage().persistent().remove(&commitment_key);
        token_client(&env).transfer(&env.current_contract_address(), &promise.recipient, &promise.amount);
    }

    /// Return a reserved amount to the unreserved pool. The owner must authorize it.
    pub fn cancel(env: Env, owner: Address, id: u64) {
        owner.require_auth();
        let commitment_key = Key::Commitment(owner.clone(), id);
        let promise: Promise = env.storage().persistent().get(&commitment_key).expect("unknown commitment");
        let reserved_key = Key::Reserved(owner);
        let updated = stored(&env, &reserved_key).checked_sub(promise.amount).expect("corrupt reserve");
        persist(&env, &reserved_key, updated);
        env.storage().persistent().remove(&commitment_key);
    }

    /// Withdraw only the amount that isn't reserved for commitments.
    pub fn withdraw(env: Env, owner: Address, amount: i128) {
        positive(amount);
        owner.require_auth();
        assert!(available(&env, &owner) >= amount, "reserved funds cannot be withdrawn");
        let key = Key::Balance(owner.clone());
        let updated = stored(&env, &key).checked_sub(amount).expect("corrupt balance");
        persist(&env, &key, updated);
        token_client(&env).transfer(&env.current_contract_address(), &owner, &amount);
    }

    pub fn balance(env: Env, owner: Address) -> i128 { stored(&env, &Key::Balance(owner)) }
    pub fn reserved(env: Env, owner: Address) -> i128 { stored(&env, &Key::Reserved(owner)) }
    pub fn available(env: Env, owner: Address) -> i128 { available(&env, &owner) }
    pub fn commitment(env: Env, owner: Address, id: u64) -> Promise {
        env.storage().persistent().get(&Key::Commitment(owner, id)).expect("unknown commitment")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, token::StellarAssetClient};

    #[test]
    fn reserves_are_not_withdrawable_and_pay_only_the_named_recipient() {
        let env = Env::default();
        env.mock_all_auths();
        let issuer = Address::generate(&env);
        let owner = Address::generate(&env);
        let supplier = Address::generate(&env);
        let token = env.register_stellar_asset_contract_v2(issuer);
        let token_id = token.address();
        StellarAssetClient::new(&env, &token_id).mint(&owner, &1_000);
        let vault_address = env.register(KoraGuardVault, (&token_id,));
        let vault = KoraGuardVaultClient::new(&env, &vault_address);
        let token_client = TokenClient::new(&env, &token_id);
        vault.deposit(&owner, &800);
        vault.commit(&owner, &17, &supplier, &600);
        assert_eq!(vault.balance(&owner), 800);
        assert_eq!(vault.reserved(&owner), 600);
        assert_eq!(vault.available(&owner), 200);
        assert!(vault.try_withdraw(&owner, &300).is_err());
        vault.withdraw(&owner, &200);
        assert_eq!(vault.available(&owner), 0);
        vault.pay(&owner, &17);
        assert_eq!(token_client.balance(&supplier), 600);
        assert_eq!(vault.balance(&owner), 0);
        assert_eq!(vault.reserved(&owner), 0);
    }

    #[test]
    fn cancellation_unlocks_a_commitment() {
        let env = Env::default();
        env.mock_all_auths();
        let issuer = Address::generate(&env);
        let owner = Address::generate(&env);
        let recipient = Address::generate(&env);
        let token = env.register_stellar_asset_contract_v2(issuer);
        let id = token.address();
        StellarAssetClient::new(&env, &id).mint(&owner, &500);
        let contract = env.register(KoraGuardVault, (&id,));
        let client = KoraGuardVaultClient::new(&env, &contract);
        client.deposit(&owner, &500);
        client.commit(&owner, &7, &recipient, &400);
        client.cancel(&owner, &7);
        assert_eq!(client.available(&owner), 500);
        client.withdraw(&owner, &500);
        assert_eq!(client.balance(&owner), 0);
    }
}
