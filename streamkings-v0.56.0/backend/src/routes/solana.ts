import express from 'express';
import { Connection, PublicKey } from '@solana/web3.js';

const router = express.Router();

// Solana RPC proxy endpoint
router.post('/rpc', async (req, res) => {
  try {
    const { method, params, id } = req.body;
    
    if (!method) {
      return res.status(400).json({ error: 'Method is required' });
    }

    // Make a direct RPC call to the Helius endpoint
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
    });
    
    if (!response.ok) {
      throw new Error(`RPC call failed: ${response.status}`);
    }
    
    const rpcResult = await response.json() as any;
    if (rpcResult.error) {
      throw new Error(`RPC error: ${rpcResult.error.message}`);
    }
    
    res.json({
      jsonrpc: '2.0',
      id,
      result: rpcResult.result
    });
    
  } catch (error) {
    console.error('[Solana Proxy] Error:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body.id || 1,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error'
      }
    });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSlot'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    const result = await response.json() as any;
    
    res.json({ 
      status: 'healthy', 
      slot: result.result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Solana Health] Error:', error);
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
