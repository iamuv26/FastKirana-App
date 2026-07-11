async function testLiveApi() {
  console.log('Sending mock client HTTP POST request to live Render API...');
  
  const API_URL = 'https://www.fastkirana.in/api/addresses';
  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': 'cmqmf3fbw000004ky5di7vu81', // Afraaz Khan (mock user from DB)
    'x-user-role': 'USER',
    'x-user-email': 'afraaz@gmail.com',
    'x-user-name': 'Afraaz Khan',
    'x-user-phone': '9999999999',
  };

  const payload = {
    label: 'Test App Address 📍',
    houseNo: '-',
    street: '-',
    area: 'Vikas Nagar Sector 4',
    city: 'Ghatampur',
    pincode: '209206',
    phone: '9999999999',
    isDefault: false,
    lat: 26.1534185,
    lng: 80.1714024
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    console.log(`HTTP Status: ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log('Response data from Render API:', data);

    if (res.ok && data.id) {
      console.log('✅ Live API Address Creation Test SUCCESSFUL!');
      
      // Clean up by deleting it
      const deleteRes = await fetch(API_URL, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id: data.id }),
      });
      console.log(`Cleanup Delete HTTP Status: ${deleteRes.status}`);
    } else {
      console.error('❌ Live API test failed:', data);
    }
  } catch (err) {
    console.error('❌ Network request error:', err);
  }
}

testLiveApi();
