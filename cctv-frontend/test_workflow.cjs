const axios = require('axios');

const API_BASE = 'http://localhost:8080/api';

async function testRoles() {
    try {
        console.log("Testing Admin login...");
        const adminAuth = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@cctv.com',
            password: 'admin'
        });
        const adminToken = adminAuth.data.accessToken;
        const adminDash = await axios.get(`${API_BASE}/dashboard/admin`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log("Admin Dashboard OK:", Object.keys(adminDash.data));

        console.log("Testing Customer login...");
        const custAuth = await axios.post(`${API_BASE}/auth/login`, {
            email: 'customer@test.com',
            password: 'password'
        });
        const custToken = custAuth.data.accessToken;
        const custDash = await axios.get(`${API_BASE}/dashboard/customer`, {
            headers: { Authorization: `Bearer ${custToken}` }
        });
        console.log("Customer Dashboard OK:", Object.keys(custDash.data));

        console.log("Testing Technician login...");
        const techAuth = await axios.post(`${API_BASE}/auth/login`, {
            email: 'tech@test.com',
            password: 'password'
        });
        const techToken = techAuth.data.accessToken;
        const techDash = await axios.get(`${API_BASE}/dashboard/technician`, {
            headers: { Authorization: `Bearer ${techToken}` }
        });
        console.log("Technician Dashboard OK:", Object.keys(techDash.data));

        console.log("Testing Partner login...");
        const partnerAuth = await axios.post(`${API_BASE}/auth/login`, {
            email: 'partner@test.com',
            password: 'password'
        });
        const partnerToken = partnerAuth.data.accessToken;
        const partnerDash = await axios.get(`${API_BASE}/dashboard/partner`, {
            headers: { Authorization: `Bearer ${partnerToken}` }
        });
        console.log("Partner Dashboard OK:", Object.keys(partnerDash.data));

        console.log("All roles and dashboards tested successfully!");

    } catch (e) {
        console.error("Error during API test:", e.response ? e.response.data : e.message);
    }
}

testRoles();
