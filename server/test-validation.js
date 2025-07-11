// Quick test for validation logic
const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const testDaysOfWeek = ["monday"];

console.log('Test array:', testDaysOfWeek);
console.log('Is array?', Array.isArray(testDaysOfWeek));
console.log('Every test:', testDaysOfWeek.every(day => validDays.includes(day.toLowerCase())));

// Test individual day
console.log('monday in validDays?', validDays.includes('monday'));
console.log('monday.toLowerCase():', 'monday'.toLowerCase());
