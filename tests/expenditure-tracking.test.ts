import { describe, it, expect, beforeEach } from 'vitest';
import {
  Client,
  Provider,
  Receipt,
  Result,
  StacksTestnet
} from '@stacks/transactions';
import { principalCV, stringAsciiCV, uintCV } from '@stacks/transactions/dist/clarity/types/typeUtils';

describe('Political Donation Contract', () => {
  let client: Client;
  let provider: Provider;
  const CONTRACT_NAME = 'political-donation';
  const CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
  const DONOR_ADDRESS = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
  const RECIPIENT_ADDRESS = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC';
  
  beforeEach(async () => {
    provider = new StacksTestnet();
    client = new Client(CONTRACT_ADDRESS, CONTRACT_NAME, provider);
  });
  
  describe('Donation Functions', () => {
    it('should allow valid donations above minimum', async () => {
      const donationAmount = 1000000; // 1 STX
      const tx = client.createTransaction({
        method: { name: 'donate', args: [] },
        senderAddress: DONOR_ADDRESS,
        amount: donationAmount
      });
      
      const receipt = await tx.sign(DONOR_ADDRESS).broadcast();
      const result = Result.unwrap(receipt);
      
      expect(result.success).toBe(true);
      
      // Verify donor info
      const donorInfo = await client.readOnlyFunction({
        method: { name: 'get-donor-info', args: [principalCV(DONOR_ADDRESS)] }
      });
      
      const { totalDonated } = donorInfo.value;
      expect(totalDonated).toBe(donationAmount);
    });
    
    it('should reject donations below minimum', async () => {
      const donationAmount = 50000; // 0.05 STX (below minimum)
      const tx = client.createTransaction({
        method: { name: 'donate', args: [] },
        senderAddress: DONOR_ADDRESS,
        amount: donationAmount
      });
      
      const receipt = await tx.sign(DONOR_ADDRESS).broadcast();
      expect(receipt.error).toBe('ERR-BELOW-MINIMUM');
    });
  });
  
  describe('Spending Categories', () => {
    it('should allow owner to add spending categories', async () => {
      const categoryName = 'Advertising';
      const tx = client.createTransaction({
        method: {
          name: 'add-spending-category',
          args: [stringAsciiCV(categoryName)]
        },
        senderAddress: CONTRACT_ADDRESS
      });
      
      const receipt = await tx.sign(CONTRACT_ADDRESS).broadcast();
      const result = Result.unwrap(receipt);
      expect(result.success).toBe(true);
      
      // Verify category was added
      const categoryInfo = await client.readOnlyFunction({
        method: {
          name: 'get-category-info',
          args: [stringAsciiCV(categoryName)]
        }
      });
      
      expect(categoryInfo.value.active).toBe(true);
    });
    
    it('should prevent non-owners from adding categories', async () => {
      const categoryName = 'Unauthorized';
      const tx = client.createTransaction({
        method: {
          name: 'add-spending-category',
          args: [stringAsciiCV(categoryName)]
        },
        senderAddress: DONOR_ADDRESS
      });
      
      const receipt = await tx.sign(DONOR_ADDRESS).broadcast();
      expect(receipt.error).toBe('ERR-NOT-AUTHORIZED');
    });
  });
  
  describe('Expenditure Management', () => {
    beforeEach(async () => {
      // Setup: Add a category and make a donation
      await client.createTransaction({
        method: {
          name: 'add-spending-category',
          args: [stringAsciiCV('Events')]
        },
        senderAddress: CONTRACT_ADDRESS
      }).sign(CONTRACT_ADDRESS).broadcast();
      
      await client.createTransaction({
        method: { name: 'donate', args: [] },
        senderAddress: DONOR_ADDRESS,
        amount: 5000000 // 5 STX
      }).sign(DONOR_ADDRESS).broadcast();
    });
    
    it('should allow owner to propose expenditures', async () => {
      const tx = client.createTransaction({
        method: {
          name: 'propose-expenditure',
          args: [
            uintCV(1000000), // 1 STX
            stringAsciiCV('Events'),
            principalCV(RECIPIENT_ADDRESS),
            stringAsciiCV('Campaign Rally Venue')
          ]
        },
        senderAddress: CONTRACT_ADDRESS
      });
      
      const receipt = await tx.sign(CONTRACT_ADDRESS).broadcast();
      const result = Result.unwrap(receipt);
      expect(result.success).toBe(true);
      
      // Verify expenditure was created
      const expenditure = await client.readOnlyFunction({
        method: {
          name: 'get-expenditure',
          args: [uintCV(0)] // First expenditure
        }
      });
      
      expect(expenditure.value.amount).toBe(1000000);
      expect(expenditure.value.approved).toBe(false);
    });
    
    it('should properly track approved expenditures', async () => {
      // First propose an expenditure
      await client.createTransaction({
        method: {
          name: 'propose-expenditure',
          args: [
            uintCV(1000000),
            stringAsciiCV('Events'),
            principalCV(RECIPIENT_ADDRESS),
            stringAsciiCV('Campaign Rally Venue')
          ]
        },
        senderAddress: CONTRACT_ADDRESS
      }).sign(CONTRACT_ADDRESS).broadcast();
      
      // Then approve it
      const approveTx = client.createTransaction({
        method: {
          name: 'approve-expenditure',
          args: [uintCV(0)]
        },
        senderAddress: CONTRACT_ADDRESS
      });
      
      const receipt = await approveTx.sign(CONTRACT_ADDRESS).broadcast();
      const result = Result.unwrap(receipt);
      expect(result.success).toBe(true);
      
      // Verify expenditure was approved and funds were transferred
      const expenditure = await client.readOnlyFunction({
        method: {
          name: 'get-expenditure',
          args: [uintCV(0)]
        }
      });
      
      expect(expenditure.value.approved).toBe(true);
      
      // Check category spending was updated
      const categoryInfo = await client.readOnlyFunction({
        method: {
          name: 'get-category-info',
          args: [stringAsciiCV('Events')]
        }
      });
      
      expect(categoryInfo.value.spent).toBe(1000000);
    });
  });
  
  describe('Contract Balance', () => {
    it('should accurately track contract balance', async () => {
      // Make a donation
      const donationAmount = 2000000; // 2 STX
      await client.createTransaction({
        method: { name: 'donate', args: [] },
        senderAddress: DONOR_ADDRESS,
        amount: donationAmount
      }).sign(DONOR_ADDRESS).broadcast();
      
      // Check balance
      const balance = await client.readOnlyFunction({
        method: { name: 'get-balance', args: [] }
      });
      
      expect(balance.value).toBe(donationAmount);
      
      // Make an expenditure and verify balance decrease
      await client.createTransaction({
        method: {
          name: 'propose-expenditure',
          args: [
            uintCV(1000000),
            stringAsciiCV('Events'),
            principalCV(RECIPIENT_ADDRESS),
            stringAsciiCV('Venue Rental')
          ]
        },
        senderAddress: CONTRACT_ADDRESS
      }).sign(CONTRACT_ADDRESS).broadcast();
      
      await client.createTransaction({
        method: {
          name: 'approve-expenditure',
          args: [uintCV(0)]
        },
        senderAddress: CONTRACT_ADDRESS
      }).sign(CONTRACT_ADDRESS).broadcast();
      
      const newBalance = await client.readOnlyFunction({
        method: { name: 'get-balance', args: [] }
      });
      
      expect(newBalance.value).toBe(1000000); // Original 2 STX - 1 STX spent
    });
  });
});

// Helper function to wait for transaction confirmation
async function waitForConfirmation(receipt: Receipt): Promise<void> {
  return new Promise((resolve) => {
    const checkTx = async () => {
      const status = await receipt.getStatus();
      if (status.status === 'success') {
        resolve();
      } else if (status.status === 'pending') {
        setTimeout(checkTx, 1000);
      }
    };
    checkTx();
  });
}
