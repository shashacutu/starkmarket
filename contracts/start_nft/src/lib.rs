#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Owner(i128),
    Approval(i128),
}

#[contract]
pub struct StartNFT;

#[contractimpl]
impl StartNFT {
    pub fn mint(env: Env, to: Address, id: i128) {
        if env.storage().instance().has(&DataKey::Owner(id)) {
            panic!("already minted");
        }
        env.storage().instance().set(&DataKey::Owner(id), &to);
    }

    pub fn owner_of(env: Env, id: i128) -> Address {
        env.storage().instance().get(&DataKey::Owner(id)).unwrap()
    }

    pub fn approve(env: Env, from: Address, spender: Address, id: i128, _expiration_ledger: u64) {
        from.require_auth();
        let owner: Address = env.storage().instance().get(&DataKey::Owner(id)).unwrap();
        if owner != from {
            panic!("not owner");
        }
        env.storage().instance().set(&DataKey::Approval(id), &spender);
    }

    pub fn transfer(env: Env, from: Address, to: Address, id: i128) {
        let owner: Address = env.storage().instance().get(&DataKey::Owner(id)).unwrap();
        
        if owner == from {
            from.require_auth();
        } else {
            let approved: Address = env.storage().instance().get(&DataKey::Approval(id)).unwrap();
            if approved == from {
                 // In this case, 'from' is the authorized spender
                 // But in SEP-41, transfer(from, to, amount) usually auths 'from'.
                 // If the marketplace is calling it, 'from' in the call is the seller.
            }
            // For Marketplace compatibility:
            from.require_auth(); 
        }

        env.storage().instance().set(&DataKey::Owner(id), &to);
        env.storage().instance().remove(&DataKey::Approval(id));
    }
}
