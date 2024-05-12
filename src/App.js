import React, { useState, useEffect } from 'react';

function Dashboard() {
  const [responseData, setResponseData] = useState([]);
  const [batches, setBatches] = useState([]);
  const [expandedBatch, setExpandedBatch] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://api.sheety.co/1b17759ba95158dea67deea075d08aa9/cabdata/formResponses1');
        const data = await response.json();
        setResponseData(data.formResponses1);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Function to group entries into batches
    const groupIntoBatches = () => {
      const batchesMap = new Map();

      // Filter CNG entries and group by batch date
      responseData.filter(entry => entry.type === 'CNG' || entry.type === 'Petrol').forEach(entry => {
        const entryDate = new Date(entry.date);
        const dayOfMonth = entryDate.getDate();
        const batchStart = new Date(entryDate.getFullYear(), entryDate.getMonth(), dayOfMonth < 11 ? 1 : dayOfMonth < 21 ? 11 : 21);
        const batchKey = batchStart.toISOString().split('T')[0];
        const batch = batchesMap.get(batchKey) || { date: batchStart, entries: [], totalAmountCNG: 0, totalTrips: 0, totalAmountPetrol: 0 };
        batch.entries.push(entry);
        if (entry.type === 'CNG') {
          batch.totalAmountCNG += entry.amount;
          batch.totalTrips += entry.trips ? entry.trips : 0;
        } else if (entry.type === 'Petrol') {
          batch.totalAmountPetrol += entry.amount;
        }
        batchesMap.set(batchKey, batch);
      });

      // Include an ongoing batch if necessary
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const currentDay = currentDate.getDate();

      const ongoingBatchDate = new Date(currentYear, currentMonth, currentDay < 11 ? 1 : currentDay < 21 ? 11 : 21);
      const ongoingBatchKey = ongoingBatchDate.toISOString().split('T')[0];
      const ongoingBatch = batchesMap.get(ongoingBatchKey) || { date: ongoingBatchDate, entries: [], totalAmountCNG: 0, totalTrips: 0, totalAmountPetrol: 0 };
      ongoingBatch.ongoing = true;

      batchesMap.set(ongoingBatchKey, ongoingBatch);

      // Convert map to array of batches
      const batchesArray = [...batchesMap.values()];

      // Sort batches by date in descending order
      batchesArray.sort((a, b) => b.date - a.date);

      setBatches(batchesArray);
    };

    if (responseData.length > 0) {
      groupIntoBatches();
    }
  }, [responseData]);

  // Function to handle batch expansion
  const handleExpandBatch = batchIndex => {
    setExpandedBatch(expandedBatch === batchIndex ? null : batchIndex);
  };

  return (
    <div>
      <h1>Dashboard</h1>
      {batches.length > 0 ? (
        <>
          {batches.map((batch, index) => (
            <div key={index}>
              <h2 onClick={() => handleExpandBatch(index)}>Batch: {batch.date.toLocaleDateString()}{batch.ongoing && " (Ongoing Batch)"}</h2>
              {expandedBatch === index && (
                <>
                  <p>Total CNG Amount: {batch.totalAmountCNG}</p>
                  <p>Total Petrol Amount: {batch.totalAmountPetrol}</p>
                  <p>Total Trips: {batch.totalTrips}</p>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount (CNG)</th>
                        <th>Amount (Petrol)</th>
                        <th>Trips</th>
                        {/* Add more headers as needed */}
                      </tr>
                    </thead>
                    <tbody>
                      {batch.entries.map((entry, entryIndex) => (
                        <tr key={entryIndex}>
                          <td>{entry.date}</td>
                          <td>{entry.type === 'CNG' ? entry.amount : '-'}</td>
                          <td>{entry.type === 'Petrol' ? entry.amount : '-'}</td>
                          <td>{entry.trips ? entry.trips : '-'}</td>
                          {/* Add more columns as needed */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          ))}
        </>
      ) : (
        <p>No data available.</p>
      )}
    </div>
  );
}

export default Dashboard;
