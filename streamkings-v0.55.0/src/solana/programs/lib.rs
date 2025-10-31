use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, TokenInterface, Mint, TokenAccount};

declare_id!("D4b2rvBeV4sMAkPRZjytgzWoi1N57jFrrFq2oxDyGPtU");

#[program]
pub mod uniform_token_actions {
    use super::*;

    /// Platform-earning action: User → Platform (with fee split to fee_wallet and platform_wallet)
    pub fn platform_action(
        ctx: Context<PlatformAction>,
        action: String,
        _amount: u64,
    ) -> Result<()> {
        // Validate that the mint matches the configured token
        require!(
            ctx.accounts.mint.key() == ctx.accounts.config.token_mint,
            CustomError::WrongTokenMint
        );
        
        // Note: Owner validation removed for Token-2022 compatibility
        // The token program will handle authority validation during transfer

        // Find action config by name
        let action_config = find_action_config(&ctx.accounts.config.actions, &action)?;
        
        // Validate this is a platform action
        require!(
            action_config.is_platform_action,
            CustomError::InvalidPlatformAction
        );

        // Use fixed price from config for platform actions
        let transfer_amount = action_config.price;
        
        emit!(TransferEvent {
            action: action.clone(),
            amount: transfer_amount,
            fee_percent: action_config.fee_percent,
            from: ctx.accounts.from.key(),
            to: ctx.accounts.platform_wallet.key(),
        });
        
        // Transfer with fee split between fee_wallet and platform_wallet
        transfer_with_platform_fee(&ctx, transfer_amount, action_config.fee_percent as u64, &action)
    }

    /// User-to-user action: User → User + fee to Platform/Fee Wallet
    pub fn user_action(
        ctx: Context<UserAction>,
        action: String,
        amount: u64,
    ) -> Result<()> {
        // Validate that the mint matches the configured token
        require!(
            ctx.accounts.mint.key() == ctx.accounts.config.token_mint,
            CustomError::WrongTokenMint
        );
        
        // Note: Owner validation removed for Token-2022 compatibility
        // The token program will handle authority validation during transfer

        // Find action config by name
        let action_config = find_action_config(&ctx.accounts.config.actions, &action)?;
        
        // Validate this is a user action
        require!(
            !action_config.is_platform_action,
            CustomError::InvalidUserAction
        );

        // Use amount based on is_variable flag
        let transfer_amount = if action_config.is_variable {
            amount // Variable amount
        } else {
            action_config.price // Fixed price
        };
        
        emit!(TransferEvent {
            action: action.clone(),
            amount: transfer_amount,
            fee_percent: action_config.fee_percent,
            from: ctx.accounts.from.key(),
            to: ctx.accounts.receiver_wallet.key(),
        });
        
        // Transfer with fee to fee_wallet
        transfer_with_user_fee(&ctx, transfer_amount, action_config.fee_percent as u64, &action)
    }

    pub fn init_config(
        ctx: Context<InitConfig>,
        fee_wallet: Pubkey,
        platform_wallet: Pubkey,
        token_mint: Pubkey,
        actions: Vec<ActionConfig>,
    ) -> Result<()> {
        // Validate all actions
        for action in &actions {
            require!(action.fee_percent <= 100, CustomError::InvalidFeePercent);
            require!(!action.name.is_empty(), CustomError::InvalidAction);
        }

        let config = &mut ctx.accounts.config;
        config.bump = ctx.bumps.config;

        config.authority = ctx.accounts.authority.key();
        config.fee_wallet = fee_wallet;
        config.platform_wallet = platform_wallet;
        config.token_mint = token_mint;
        config.actions = actions;

        Ok(())
    }

    pub fn update_config(
        ctx: Context<UpdateConfig>,
        fee_wallet: Pubkey,
        platform_wallet: Pubkey,
        token_mint: Pubkey,
        actions: Vec<ActionConfig>,
    ) -> Result<()> {
        // Validate all actions
        for action in &actions {
            require!(action.fee_percent <= 100, CustomError::InvalidFeePercent);
            require!(!action.name.is_empty(), CustomError::InvalidAction);
        }

        let config = &mut ctx.accounts.config;
        require!(
            ctx.accounts.authority.key() == config.authority,
            CustomError::Unauthorized
        );

        config.fee_wallet = fee_wallet;
        config.platform_wallet = platform_wallet;
        config.token_mint = token_mint;
        config.actions = actions;

        Ok(())
    }

    /// Add a new action to the config (upgradeable)
    pub fn add_action(
        ctx: Context<UpdateConfig>,
        new_action: ActionConfig,
    ) -> Result<()> {
        require!(new_action.fee_percent <= 100, CustomError::InvalidFeePercent);
        require!(!new_action.name.is_empty(), CustomError::InvalidAction);

        let config = &mut ctx.accounts.config;
        require!(
            ctx.accounts.authority.key() == config.authority,
            CustomError::Unauthorized
        );

        // Check if action already exists
        require!(
            !config.actions.iter().any(|action| action.name == new_action.name),
            CustomError::InvalidAction
        );

        config.actions.push(new_action);
        Ok(())
    }

    pub fn update_action(
        ctx: Context<UpdateConfig>,
        action_name: String,
        updated_action: ActionConfig,
    ) -> Result<()> {
        require!(updated_action.fee_percent <= 100, CustomError::InvalidFeePercent);
        require!(!updated_action.name.is_empty(), CustomError::InvalidAction);
        require!(!action_name.is_empty(), CustomError::InvalidAction);

        let config = &mut ctx.accounts.config;
        require!(
            ctx.accounts.authority.key() == config.authority,
            CustomError::Unauthorized
        );

        // Find the action to update
        let action_index = config.actions.iter().position(|action| action.name == action_name);
        
        if let Some(index) = action_index {
            // Update existing action
            config.actions[index] = updated_action;
        } else {
            // Add new action if it doesn't exist
            config.actions.push(updated_action);
        }
        
        Ok(())
    }

    pub fn remove_action(
        ctx: Context<UpdateConfig>,
        action_name: String,
    ) -> Result<()> {
        require!(!action_name.is_empty(), CustomError::InvalidAction);

        let config = &mut ctx.accounts.config;
        require!(
            ctx.accounts.authority.key() == config.authority,
            CustomError::Unauthorized
        );

        // Find and remove the action
        let action_index = config.actions.iter().position(|action| action.name == action_name);
        require!(action_index.is_some(), CustomError::InvalidAction);

        let index = action_index.unwrap();
        config.actions.remove(index);
        
        Ok(())
    }
}

// ----------------------------------------
// Utility Functions
// ----------------------------------------

fn find_action_config<'a>(actions: &'a Vec<ActionConfig>, action_name: &str) -> Result<&'a ActionConfig> {
    actions.iter()
        .find(|action| action.name == action_name)
        .ok_or(CustomError::InvalidAction.into())
}

// ----------------------------------------
// Transfer Functions
// ----------------------------------------

fn transfer_with_platform_fee(
    ctx: &Context<PlatformAction>,
    amount: u64,
    fee_percent: u64,
    _action: &str,
) -> Result<()> {
    require!(amount > 0, CustomError::IncorrectAmount);

    let fee_amount = amount * fee_percent / 100;
    let net_amount = amount - fee_amount;

    // Read decimals from mint account
    let decimals = ctx.accounts.mint.decimals;

    // Transfer main amount to platform wallet
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token_interface::TransferChecked {
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.platform_wallet.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
        },
    );
    token_interface::transfer_checked(cpi_ctx, net_amount, decimals)?; // Use dynamic decimals

    // Transfer fee to fee_wallet
    if fee_amount > 0 {
        let cpi_fee_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token_interface::TransferChecked {
                from: ctx.accounts.from.to_account_info(),
                to: ctx.accounts.fee_wallet.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
            },
        );
        token_interface::transfer_checked(cpi_fee_ctx, fee_amount, decimals)?; // Use dynamic decimals
    }

    Ok(())
}

fn transfer_with_user_fee(
    ctx: &Context<UserAction>,
    amount: u64,
    fee_percent: u64,
    _action: &str,
) -> Result<()> {
    require!(amount > 0, CustomError::IncorrectAmount);

    let fee_amount = amount * fee_percent / 100;
    let net_amount = amount - fee_amount;

    // Read decimals from mint account
    let decimals = ctx.accounts.mint.decimals;

    // Transfer main amount to receiver wallet
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token_interface::TransferChecked {
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.receiver_wallet.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
        },
    );
    token_interface::transfer_checked(cpi_ctx, net_amount, decimals)?; // Use dynamic decimals

    // Transfer fee to fee_wallet
    if fee_amount > 0 {
        let cpi_fee_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token_interface::TransferChecked {
                from: ctx.accounts.from.to_account_info(),
                to: ctx.accounts.fee_wallet.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
            },
        );
        token_interface::transfer_checked(cpi_fee_ctx, fee_amount, decimals)?; // Use dynamic decimals
    }

    Ok(())
}

// ----------------------------------------
// Account Contexts
// ----------------------------------------

#[derive(Accounts)]
pub struct PlatformAction<'info> {
    /// CHECK: This is a token account that will be validated by the token program during transfer
    #[account(mut)]
    pub from: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: This is a token account that will be validated by the token program during transfer
    #[account(mut)]
    pub platform_wallet: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: This is a token account that will be validated by the token program during transfer
    #[account(mut)]
    pub fee_wallet: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub config: Account<'info, Config>,

    pub mint: InterfaceAccount<'info, Mint>,

    pub authority: Signer<'info>,

    /// CHECK: This is a program account that will be validated by the token program during transfer
    pub token_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UserAction<'info> {
    /// CHECK: This is a token account that will be validated by the token program during transfer
    #[account(mut)]
    pub from: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: This is a token account that will be validated by the token program during transfer
    #[account(mut)]
    pub receiver_wallet: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: This is a token account that will be validated by the token program during transfer
    #[account(mut)]
    pub fee_wallet: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub config: Account<'info, Config>,

    pub mint: InterfaceAccount<'info, Mint>,

    pub authority: Signer<'info>,

    /// CHECK: This is a program account that will be validated by the token program during transfer
    pub token_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(init, payer = authority, space = 8 + 1 + 32 + 32 + 32 + 32 + 4 + (10 * 50), seeds = [b"config"], bump)] // 8 + bump + 4*32 + Vec<ActionConfig> (4 bytes len + 10 actions * ~50 bytes each)
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub authority: Signer<'info>,


    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut)]
    pub config: Account<'info, Config>,

    pub authority: Signer<'info>,
}

// ----------------------------------------
// Data Structs
// ----------------------------------------

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ActionConfig {
    pub name: String,
    pub price: u64,
    pub fee_percent: u8,
    pub is_variable: bool,
    pub is_platform_action: bool, // true = platform action, false = user action
}

#[account]
pub struct Config {
    pub bump: u8,
    pub authority: Pubkey,
    pub fee_wallet: Pubkey,
    pub platform_wallet: Pubkey,
    pub token_mint: Pubkey,
    pub actions: Vec<ActionConfig>, // Dynamic list of all actions
}

// ----------------------------------------
// Custom Errors
// ----------------------------------------

#[error_code]
pub enum CustomError {
    #[msg("Unauthorized.")]
    Unauthorized,
    #[msg("Amount must be greater than 0.")]
    IncorrectAmount,
    #[msg("Wrong token mint. This program only accepts the configured token.")]
    WrongTokenMint,
    #[msg("Invalid fee percent. Must be between 0 and 100.")]
    InvalidFeePercent,
    #[msg("Invalid platform action. Action not supported.")]
    InvalidPlatformAction,
    #[msg("Invalid user action. Action not supported.")]
    InvalidUserAction,
    #[msg("Invalid action. Action not found or invalid.")]
    InvalidAction,
}

// ----------------------------------------
// Events
// ----------------------------------------
#[event]
pub struct TransferEvent {
    pub action: String,
    pub amount: u64,
    pub fee_percent: u8,
    pub from: Pubkey,
    pub to: Pubkey,
}
