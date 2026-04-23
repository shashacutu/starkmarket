#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, String};

#[contract]
pub struct StartNFT;

#[contractimpl]
impl StartNFT {
    pub fn mint(env: Env, to: Address, id: i128) {
        // Simple minting logic for demo
        env.storage().instance().set(&id, &to);
    }

    pub fn owner_of(env: Env, id: i128) -> Address {
        env.storage().instance().get(&id).unwrap()
    }

    pub fn transfer(env: Env, from: Address, to: Address, id: i128) {
        from.require_auth();
        let owner: Address = env.storage().instance().get(&id).unwrap();
        if owner != from {
            panic!("not owner");
        }
        env.storage().instance().set(&id, &to);
    }
}
