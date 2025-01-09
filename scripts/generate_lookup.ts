const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function generateLookupTable() {
    console.log('Starting lookup table generation...');

    // Query to get all call_number and loc_item_link pairs
    const query = `SELECT call_number, photograph_type, loc_item_link FROM photogrammar_photos WHERE call_number IS NOT NULL AND loc_item_link IS NOT NULL`;
    const url = `https://digitalscholarshiplab.cartodb.com/api/v2/sql?format=JSON&q=${encodeURIComponent(query)}`;

    console.log('Fetching data from database...');
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.rows || data.rows.length === 0) {
        throw new Error('No data returned from database');
    }

    console.log(`Retrieved ${data.rows.length} entries`);

    // Convert to CSV
    const csvRows = [
        'call_number,loc_item_link'  // header row
    ];

    data.rows.forEach((row) => {
        if (row.call_number && row.loc_item_link) {
            // Format call number with photograph type
            const formattedCallNumber = row.photograph_type ? `${row.call_number}-${row.photograph_type}` : row.call_number;
            // Escape any commas in the values
            const escapedCall = formattedCallNumber.includes(',') ? `"${formattedCallNumber}"` : formattedCallNumber;
            const escapedLink = row.loc_item_link.includes(',') ? `"${row.loc_item_link}"` : row.loc_item_link;
            csvRows.push(`${escapedCall},${escapedLink}`);
        }
    });

    // Save to file
    const outputPath = path.join(__dirname, '..', 'public', 'data', 'addi-metadata', 'fsa', 'call_number_lookup.csv');
    fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf8');

    console.log(`Saved ${csvRows.length - 1} entries to ${outputPath}`);

    // Print some sample entries
    console.log('\nSample entries:');
    csvRows.slice(1, 6).forEach(row => console.log(row));
}

// Run the script
generateLookupTable().catch(error => {
    console.error('Error generating lookup table:', error);
    process.exit(1);
}); 