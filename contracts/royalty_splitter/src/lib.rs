#![no_std]
use soroban_sdk::{contract, contractimpl, token, Address, Env};

#[contract]
pub struct RoyaltySplitter;

#[contractimpl]
impl RoyaltySplitter {
    pub fn split_payment(
        env: Env,
        payment_token: Address,
        total_amount: i128,
        creator: Address,
        seller: Address,
        royalty_bps: u32,
    ) {
        let royalty_amount = (total_amount * royalty_bps as i128) / 10000;
        let seller_amount = total_amount - royalty_amount;

        let client = token::Client::new(&env, &payment_token);

        // Transfer royalty to creator
        if royalty_amount > 0 {
            client.transfer(&env.current_contract_address(), &creator, &royalty_amount);
        }

        // Transfer remaining proceeds to seller
        if seller_amount > 0 {
            client.transfer(&env.current_contract_address(), &seller, &seller_amount);
        }
    }
}
