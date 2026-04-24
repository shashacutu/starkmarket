#![no_std]
mod test;
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env};

mod royalty_splitter_contract {
    soroban_sdk::contractimport!(
        file = "../../target/wasm32-unknown-unknown/release/royalty_splitter.wasm"
    );
}

#[contracttype]
#[derive(Clone)]
pub struct Listing {
    pub seller: Address,
    pub nft_token: Address,
    pub nft_id: i128,
    pub payment_token: Address,
    pub price: i128,
    pub creator: Address,
    pub royalty_bps: u32,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Listing(i128),
}

#[contract]
pub struct Marketplace;

#[contractimpl]
impl Marketplace {
    pub fn list_nft(
        env: Env,
        seller: Address,
        nft_token: Address,
        nft_id: i128,
        payment_token: Address,
        price: i128,
        creator: Address,
        royalty_bps: u32,
    ) {
        seller.require_auth();

        let listing = Listing {
            seller: seller.clone(),
            nft_token: nft_token.clone(),
            nft_id,
            payment_token,
            price,
            creator,
            royalty_bps,
        };
        env.storage().instance().set(&DataKey::Listing(nft_id), &listing);

        let nft_client = token::Client::new(&env, &nft_token);
        nft_client.transfer(&seller, &env.current_contract_address(), &nft_id);
    }

    pub fn buy_nft(env: Env, buyer: Address, nft_id: i128, splitter_address: Address) {
        buyer.require_auth();

        let listing: Listing = env.storage().instance().get(&DataKey::Listing(nft_id))
            .expect("Listing not found on blockchain");

        let payment_client = token::Client::new(&env, &listing.payment_token);
        let nft_client = token::Client::new(&env, &listing.nft_token);

        // 1. Transfer payment from buyer to marketplace
        payment_client.transfer(&buyer, &env.current_contract_address(), &listing.price);

        // 2. Transfer payment from marketplace to splitter
        payment_client.transfer(&env.current_contract_address(), &splitter_address, &listing.price);

        // 3. Call Royalty Splitter to distribute funds
        let splitter_client = royalty_splitter_contract::Client::new(&env, &splitter_address);
        splitter_client.split_payment(
            &listing.payment_token,
            &listing.price,
            &listing.creator,
            &listing.seller,
            &listing.royalty_bps,
        );

        // 3. Transfer NFT to buyer
        nft_client.transfer(&env.current_contract_address(), &buyer, &listing.nft_id);

        // 4. Remove listing
        env.storage().instance().remove(&DataKey::Listing(nft_id));
    }

    pub fn get_listing(env: Env, nft_id: i128) -> Option<Listing> {
        env.storage().instance().get(&DataKey::Listing(nft_id))
    }

    pub fn delist_nft(env: Env, seller: Address, nft_id: i128) {
        seller.require_auth();

        let listing: Listing = env.storage().instance().get(&DataKey::Listing(nft_id))
            .expect("Listing not found");
        
        if listing.seller != seller {
            panic!("Not the seller");
        }

        let nft_client = token::Client::new(&env, &listing.nft_token);
        nft_client.transfer(&env.current_contract_address(), &seller, &nft_id);

        env.storage().instance().remove(&DataKey::Listing(nft_id));
    }
}
