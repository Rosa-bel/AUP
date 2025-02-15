import React, { useState } from 'react';
import { Upload, Search, Package, Calculator, PieChart } from 'lucide-react';

function App() {
  const [image, setImage] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const MODEL_ID = "my-first-project-uvzhp";
  const MODEL_VERSION = "3";
  const API_KEY = "9BXYcZZaIzJnYrkTjgCR";
  const URL = `https://detect.roboflow.com/${MODEL_ID}/${MODEL_VERSION}?api_key=${API_KEY}`;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

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

  const calculateStatistics = (predictions) => {
    if (!predictions || !predictions.predictions) return null;

    const classCounts = {};
    const typeCountsByProduct = {};

    predictions.predictions.forEach((item) => {
      const [product, type] = item.class.split('_');
      
      if (classCounts[item.class]) {
        classCounts[item.class]++;
      } else {
        classCounts[item.class] = 1;
      }
      
      if (!typeCountsByProduct[product]) {
        typeCountsByProduct[product] = {
          'CANNETTE': 0,
          'PET': 0,
          'PACK': 0,
          'TOTAL': 0
        };
      }
      
      if (type === 'CANNETTE' || type === 'PET' || type === 'PACK') {
        typeCountsByProduct[product][type]++;
        typeCountsByProduct[product]['TOTAL']++;
      }
    });

    const totalItems = predictions.predictions.length;

    let ramyCount = 0;
    let othersCount = 0;
    
    predictions.predictions.forEach(item => {
      const product = item.class.split('_')[0];
      if (product === 'RAMY') {
        ramyCount++;
      } else {
        othersCount++;
      }
    });

    const yTolerance = 20;
    const rows = [];
    const sortedPredictions = [...predictions.predictions].sort((a, b) => a.y - b.y);

    if (sortedPredictions.length > 0) {
      let currentRow = [sortedPredictions[0]];
      for (let i = 1; i < sortedPredictions.length; i++) {
        const item = sortedPredictions[i];
        const lastItemInRow = currentRow[currentRow.length - 1];

        if (Math.abs(item.y - lastItemInRow.y) <= yTolerance) {
          currentRow.push(item);
        } else {
          rows.push(currentRow);
          currentRow = [item];
        }
      }
      rows.push(currentRow);
    }

    const numRows = rows.length;

    return {
      classCounts,
      totalItems,
      numRows,
      rows,
      ramyCount,
      othersCount,
      typeCountsByProduct
    };
  };

  const statistics = predictions ? calculateStatistics(predictions) : null;

  const renderPieChart = () => {
    if (!statistics) return null;
    
    const { ramyCount, othersCount } = statistics;
    const total = ramyCount + othersCount;
    const ramyPercentage = (ramyCount / total) * 100;
    const othersPercentage = (othersCount / total) * 100;
    
    return (
      <div className="pie-chart-container">
        <div className="pie-chart" 
             style={{
               background: `conic-gradient(
                 #4CAF50 0% ${ramyPercentage}%, 
                 #2196F3 ${ramyPercentage}% 100%
               )`
             }}>
        </div>
        <div className="legend">
          <div className="legend-item">
            <span className="color-box" style={{ backgroundColor: '#4CAF50' }}></span>
            <span>RAMY: {ramyCount} ({ramyPercentage.toFixed(1)}%)</span>
          </div>
          <div className="legend-item">
            <span className="color-box" style={{ backgroundColor: '#2196F3' }}></span>
            <span>Others: {othersCount} ({othersPercentage.toFixed(1)}%)</span>
          </div>
        </div>
      </div>
    );
  };

  const renderProductTypeTable = () => {
    if (!statistics || !statistics.typeCountsByProduct) return null;
    
    const { typeCountsByProduct } = statistics;
    const products = Object.keys(typeCountsByProduct);
    
    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>CANNETTE</th>
              <th>PET</th>
              <th>PACK</th>
              <th>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product}>
                <td>{product}</td>
                <td>{typeCountsByProduct[product]['CANNETTE']}</td>
                <td>{typeCountsByProduct[product]['PET']}</td>
                <td>{typeCountsByProduct[product]['PACK']}</td>
                <td>{typeCountsByProduct[product]['TOTAL']}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">AI Vision Dashboard</h1>
      </header>

      <div className="app-content">
        <aside className="sidebar">
          <div className="upload-section">
            <h2 className="section-title">Upload Image</h2>
            
            <div className="upload-controls">
              <div className="upload-box">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  id="file-input"
                  className="file-input"
                />
                <label htmlFor="file-input" className="file-label">
                  <Upload className="upload-icon" />
                  <span>Choose Image</span>
                </label>
              </div>
              <button 
                onClick={handleImageUpload} 
                disabled={loading || !image}
                className={`upload-button ${loading ? 'loading' : ''}`}
              >
                {loading ? (
                  <>
                    <svg className="spinner" width="20" height="20" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <Search className="button-icon" />
                    Analyze Image
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>

        <main className="main-content">
          {error && (
            <div className="error-message">
              <h3 className="error-title">Error Occurred</h3>
              <p className="error-text">{error}</p>
            </div>
          )}

          {statistics ? (
            <div className="dashboard-grid">
              <div className="stat-card">
                <div className="card-header">
                  <h3 className="card-title">Total Items</h3>
                  <Package className="card-icon" />
                </div>
                <p className="stat-value">{statistics.totalItems}</p>
              </div>

              <div className="stat-card">
                <div className="card-header">
                  <h3 className="card-title">Number of Rows</h3>
                  <Calculator className="card-icon" />
                </div>
                <p className="stat-value">{statistics.numRows}</p>
              </div>

              <div className="stat-card">
                <div className="card-header">
                  <h3 className="card-title">RAMY vs Others Distribution</h3>
                  <PieChart className="card-icon" />
                </div>
                {renderPieChart()}
              </div>

              <div className="stat-card" style={{ gridColumn: '1 / -1' }}>
                <h3 className="card-title">Product Type Comparison</h3>
                {renderProductTypeTable()}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <Package className="empty-icon" />
              <h2 className="empty-title">No Data Available!</h2>
              <p className="empty-text">Upload and analyze an image to see statistics</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
