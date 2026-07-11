async function testLiveCheckStore() {
  console.log('Sending GET request to live Render check-store endpoint...');
  const url = 'https://www.fastkirana.in/api/location/check-store?lat=26.1534185&lng=80.1714024';
  try {
    const res = await fetch(url);
    console.log(`HTTP Status: ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (e: any) {
    console.error('❌ Request failed:', e.message || e);
  }
}

testLiveCheckStore();
