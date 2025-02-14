import React, { useState } from 'react';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const MODEL_ID = "my-first-project-uvzhp"; // Replace with your model ID
  const MODEL_VERSION = "2"; // Replace with your version number
  const API_KEY = "9BXYcZZaIzJnYrkTjgCR"; // Replace with your API Key
  const URL = `https://detect.roboflow.com/${MODEL_ID}/${MODEL_VERSION}?api_key=${API_KEY}`;

  const handleImageUpload = async () => {
    if (!image) {
      alert('Please select an image first.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", image);

    try {
      const response = await fetch(URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setPredictions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to calculate statistics
  const calculateStatistics = (predictions) => {
    if (!predictions || !predictions.predictions) return null;
  
    // Calculate number of items for each class
    const classCounts = {};
    predictions.predictions.forEach((item) => {
      if (classCounts[item.class]) {
        classCounts[item.class]++;
      } else {
        classCounts[item.class] = 1;
      }
    });
  
    // Calculate total number of items
    const totalItems = predictions.predictions.length;
  
    // Calculate percentages for each class
    const classPercentages = {};
    Object.keys(classCounts).forEach((className) => {
      classPercentages[className] = ((classCounts[className] / totalItems) * 100).toFixed(2) + '%';
    });
  
    // Group items by rows based on y coordinates (horizontal level)
    const yTolerance = 20; // Tolerance for y-coordinate differences (adjust as needed)
    const rows = [];
    const sortedPredictions = [...predictions.predictions].sort((a, b) => a.y - b.y); // Sort by y-coordinate
  
    let currentRow = [sortedPredictions[0]];
    for (let i = 1; i < sortedPredictions.length; i++) {
      const item = sortedPredictions[i];
      const lastItemInRow = currentRow[currentRow.length - 1];
  
      // Check if the y-coordinate is within the tolerance range
      if (Math.abs(item.y - lastItemInRow.y) <= yTolerance) {
        currentRow.push(item); // Add to the current row
      } else {
        rows.push(currentRow); // Finalize the current row
        currentRow = [item]; // Start a new row
      }
    }
    rows.push(currentRow); // Add the last row
  
    const numRows = rows.length;
  
    return {
      classCounts,
      totalItems,
      classPercentages,
      numRows,
      rows,
    };
  };
  
  const statistics = predictions ? calculateStatistics(predictions) : null;

  return (
    <div className="App">
      <h1>Roboflow Image Upload and Detection</h1>

      <div className="upload-section">
        <h2>Upload Image</h2>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />
        <button onClick={handleImageUpload} disabled={loading}>
          {loading ? 'Processing...' : 'Upload and Detect'}
        </button>
      </div>

      {error && (
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      )}

      {statistics && (
        <div className="dashboard">
          <h2>Dashboard</h2>

          <div className="summary">
            <h3>Summary</h3>
            <p>Total Items: {statistics.totalItems}</p>
            <p>Number of Rows: {statistics.numRows}</p>
          </div>

          <div className="class-stats">
            <h3>Class Statistics</h3>
            <ul>
              {Object.entries(statistics.classCounts).map(([className, count]) => (
                <li key={className}>
                  {className}: {count} ({statistics.classPercentages[className]})
                </li>
              ))}
            </ul>
          </div>

                    <div className="rows">
            <h3>Rows and Items</h3>
            {statistics.rows.map((row, rowIndex) => (
              <div key={rowIndex} className="row">
                <h4>Row {rowIndex + 1}</h4>
                <ul>
                  {row.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      {item.class} (Confidence: {(item.confidence * 100).toFixed(2)}%)
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            </div>
        </div>
      )}
    </div>
  );
}

export default App;