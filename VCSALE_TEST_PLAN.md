# VCSale Widget Test Plan

## 📋 Comprehensive Testing Guide

### 🔗 Contract Information
- **Address:** `0x587d53B1d2E857d8c514e36C59130B66d45aB408`
- **Network:** BSC Testnet
- **BSCScan:** https://testnet.bscscan.com/address/0x587d53B1d2E857d8c514e36C59130B66d45aB408

### 🧪 Test Scenarios

#### 1. Basic Widget Display
- [ ] Widget loads without errors
- [ ] Shows correct contract address
- [ ] Displays current VC price (0.001 BNB)
- [ ] Shows available VC balance (10,000 VC)
- [ ] Security status indicators work

#### 2. Wallet Connection
- [ ] Connect MetaMask to BSC Testnet
- [ ] Widget detects wallet connection
- [ ] Shows user BNB balance
- [ ] Shows user VC balance (if any)

#### 3. Purchase Validation
- [ ] **Valid Purchase (10 VC)**
  - Enter: 10 VC
  - Expected: 0.01 BNB required
  - Should work if user has BNB

- [ ] **Below Minimum (0.5 VC)**
  - Enter: 0.5 VC
  - Expected: Error "Below minimum purchase"

- [ ] **Above Maximum (1001 VC)**
  - Enter: 1001 VC  
  - Expected: Error "Above maximum purchase"

- [ ] **Insufficient BNB**
  - Enter: 100 VC (requires 0.1 BNB)
  - Expected: Error if user has < 0.1 BNB

#### 4. Security Features Testing

##### MEV Protection
- [ ] **First Purchase:** Should work normally
- [ ] **Rapid Second Purchase:** Should fail with "Too frequent purchases"
- [ ] **After 60 seconds:** Should work again

##### Rate Limiting Display
- [ ] Widget shows "Next purchase available at: [time]" when rate limited
- [ ] Security status shows rate limit status

##### Circuit Breaker Monitoring
- [ ] Widget shows current sales in window
- [ ] Displays circuit breaker status (should be inactive initially)

#### 5. Transaction Flow
- [ ] **Pre-transaction:**
  - Correct BNB amount calculated
  - Transaction button enabled
  - No error messages

- [ ] **During Transaction:**
  - "Transaction executing..." message
  - Button disabled during execution
  - Loading indicators work

- [ ] **Post-transaction:**
  - Success message displayed
  - User VC balance updated
  - User stats updated (purchased VC, spent BNB)
  - Form fields reset

#### 6. Error Handling
- [ ] **Network Errors:** Graceful error messages
- [ ] **Transaction Rejection:** Proper error display
- [ ] **Contract Errors:** Specific error messages
- [ ] **Connection Loss:** Retry mechanisms

#### 7. Security Dashboard
- [ ] All security indicators show correct status:
  - ✅ Sale Active
  - ✅ Contract Working
  - ✅ Circuit Breaker (not triggered)
  - ✅ MEV Protection
  - ✅ User Status (not blacklisted)
  - ✅ Rate Limit Status

#### 8. Real-time Updates
- [ ] Balances update after purchase
- [ ] Daily sales amount updates
- [ ] Security status updates
- [ ] Auto-refresh functionality works

### 🎯 Expected Results

#### Successful Purchase Flow:
1. User enters 10 VC
2. Widget shows 0.01 BNB required
3. User confirms transaction
4. MetaMask opens with correct amount
5. Transaction confirms on blockchain
6. User receives 10 VC tokens
7. Widget updates balances
8. Success message displayed

#### Security Flow:
1. First purchase works
2. Immediate second purchase blocked (MEV protection)
3. Timer shows "Next purchase available at: [time]"
4. After 60 seconds, purchase works again

### 🚨 Critical Tests

#### Must Pass:
- [ ] Contract address is correct
- [ ] Price calculation is accurate
- [ ] MEV protection enforced (60 sec cooldown)
- [ ] Purchase limits enforced (1-1000 VC)
- [ ] User receives correct amount of tokens
- [ ] Security status accurately displayed

#### Security Validations:
- [ ] No direct BNB transfers accepted
- [ ] All purchases go through secure purchase function
- [ ] Rate limiting prevents rapid transactions
- [ ] Circuit breaker monitoring active
- [ ] Emergency controls functional

### 🔧 Test Environment
- **Frontend:** http://localhost:5174
- **Network:** BSC Testnet (ChainID: 97)
- **Required:** MetaMask with BSC Testnet configured
- **BNB Needed:** Small amount for gas + test purchases

### 📊 Success Criteria
- ✅ All basic functionality works
- ✅ Security features properly enforced  
- ✅ Error handling graceful
- ✅ Real-time updates accurate
- ✅ Transaction flow smooth
- ✅ No critical vulnerabilities 