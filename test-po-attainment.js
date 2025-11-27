// Test script for PO Attainment functionality
const testPOAttainment = async () => {
  try {
    // Step 1: Login to get token
    console.log('Testing login...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@obeportal.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.error('Login failed:', await loginResponse.text());
      return;
    }

    const { token } = await loginResponse.json();
    console.log('✅ Login successful');

    // Step 2: Test attainment weights API
    console.log('\nTesting attainment weights API...');
    const weightsResponse = await fetch('http://localhost:3000/api/admin/attainment-weights', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (weightsResponse.ok) {
      const weightsData = await weightsResponse.json();
      console.log('✅ Weights API working:', weightsData.data);
    } else {
      console.error('❌ Weights API failed:', await weightsResponse.text());
    }

    // Step 3: Test PO Attainment calculation API
    console.log('\nTesting PO Attainment calculation...');
    const programsResponse = await fetch('http://localhost:3000/api/programs', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (programsResponse.ok) {
      const programs = await programsResponse.json();
      if (programs.length > 0) {
        const programId = programs[0].id;
        
        const batchesResponse = await fetch('http://localhost:3000/api/batches', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (batchesResponse.ok) {
          const batches = await batchesResponse.json();
          if (batches.length > 0) {
            const batchId = batches[0].id;
            
            const poAttainmentResponse = await fetch(
              `http://localhost:3000/api/programs/${programId}/po-attainment?batchId=${batchId}&programId=${programId}`,
              {
                headers: { 'Authorization': `Bearer ${token}` }
              }
            );

            if (poAttainmentResponse.ok) {
              const poData = await poAttainmentResponse.json();
              console.log('✅ PO Attainment API working:', poData.success);
              console.log('📊 Summary:', poData.data?.summary);
            } else {
              console.error('❌ PO Attainment API failed:', await poAttainmentResponse.text());
            }
          }
        }
      }
    } else {
      console.error('❌ Programs API failed:', await programsResponse.text());
    }

    console.log('\n🎉 PO Attainment module test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testPOAttainment();