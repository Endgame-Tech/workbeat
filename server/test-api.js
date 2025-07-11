const fetch = require('node-fetch');

async function testShiftTemplate() {
    try {
        const response = await fetch('http://localhost:3001/api/shift-templates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': 'connect.sid=s%3AGqnz_JL_7s3lhGEMST6SzJhIGVhWxzLJ.6oGOoMePmI0QPpn1jdK4QGj8YQDdSCJ%2BvGUzGMeGk1s; Path=/; HttpOnly'
            },
            body: JSON.stringify({
                name: 'Node Test Shift',
                startTime: '09:00',
                endTime: '17:00',
                breakDuration: 30,
                daysOfWeek: ['monday', 'tuesday', 'wednesday']
            })
        });
        
        const data = await response.json();
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

testShiftTemplate();
