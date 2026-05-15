import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud, FileText, Database, Info, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const API_BASE = 'http://localhost:8000/api';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function App() {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [file, setFile] = useState(null);
  const [query, setQuery] = useState('');
  const [queryResponse, setQueryResponse] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const res = await axios.get(`${API_BASE}/datasets/`);
      setDatasets(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post(`${API_BASE}/datasets/`, formData);
      setFile(null);
      fetchDatasets();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleQuery = async () => {
    if (!selectedDataset || !query) return;
    try {
      const res = await axios.post(`${API_BASE}/datasets/${selectedDataset.id}/query/`, { query });
      setQueryResponse(res.data.answer);
    } catch (err) {
      console.error(err);
    }
  };

  const getChartData = () => {
    if (!selectedDataset) return [];
    return selectedDataset.columns.map(col => ({
      name: col.name,
      nulls: col.null_count,
    }));
  };

  const getTypeData = () => {
    if (!selectedDataset) return [];
    const types = {};
    selectedDataset.columns.forEach(col => {
      types[col.data_type] = (types[col.data_type] || 0) + 1;
    });
    return Object.keys(types).map(key => ({ name: key, value: types[key] }));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-blue-800 flex items-center gap-2">
          <Database className="w-8 h-8" /> DataMorphix AI Agent
        </h1>
        <p className="text-gray-600">Intelligent Data Dictionary & Metadata Generation</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <UploadCloud /> Upload Dataset
          </h2>
          <div className="mb-4">
            <input type="file" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
          <button onClick={handleUpload} disabled={loading || !file} className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50">
            {loading ? 'Processing...' : 'Upload & Analyze'}
          </button>
          
          <h3 className="mt-8 font-semibold text-lg border-b pb-2 mb-4">Your Datasets</h3>
          <ul className="space-y-2">
            {datasets.map(ds => (
              <li key={ds.id} className={`p-3 rounded cursor-pointer ${selectedDataset?.id === ds.id ? 'bg-blue-100 border-blue-400 border' : 'bg-gray-50 hover:bg-gray-100'}`} onClick={() => setSelectedDataset(ds)}>
                <div className="font-medium text-gray-800">{ds.name}</div>
                <div className="text-xs text-gray-500">Status: {ds.status} | Score: {ds.health_score}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-2 space-y-6">
          {selectedDataset ? (
            <>
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-semibold mb-2">{selectedDataset.name}</h2>
                <p className="text-gray-600 mb-4">{selectedDataset.summary}</p>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded text-center">
                    <div className="text-2xl font-bold text-blue-700">{selectedDataset.health_score}/100</div>
                    <div className="text-sm text-gray-600">Health Score</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded text-center">
                    <div className="text-2xl font-bold text-green-700">{selectedDataset.columns?.length || 0}</div>
                    <div className="text-sm text-gray-600">Total Columns</div>
                  </div>
                </div>

                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><BarChart2 /> Dashboard</h3>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="h-64 border rounded p-2">
                    <h4 className="text-center text-sm font-semibold mb-2">Missing Values by Column</h4>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end" height={60} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="nulls" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-64 border rounded p-2">
                    <h4 className="text-center text-sm font-semibold mb-2">Data Type Distribution</h4>
                    <ResponsiveContainer width="100%" height="90%">
                      <PieChart>
                        <Pie data={getTypeData()} cx="50%" cy="50%" outerRadius={60} fill="#8884d8" dataKey="value" label>
                          {getTypeData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Info /> Ask AI About Data</h3>
                <div className="flex gap-2 mb-4">
                  <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. What does customer_id mean?" className="flex-1 border p-2 rounded" />
                  <button onClick={handleQuery} className="bg-indigo-600 text-white px-4 py-2 rounded">Ask</button>
                </div>
                {queryResponse && (
                  <div className="bg-indigo-50 border border-indigo-200 p-4 rounded mb-6 text-indigo-900">
                    <strong>AI Response:</strong> {queryResponse}
                  </div>
                )}
                
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><FileText /> Generated Data Dictionary</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 border">Column</th>
                        <th className="p-2 border">Type</th>
                        <th className="p-2 border">Nulls</th>
                        <th className="p-2 border">AI Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDataset.columns?.map(col => (
                        <tr key={col.id} className="border-b">
                          <td className="p-2 border font-medium text-blue-800">{col.name}</td>
                          <td className="p-2 border text-sm">{col.data_type}</td>
                          <td className="p-2 border text-sm">{col.null_count}</td>
                          <td className="p-2 border text-sm text-gray-600">{col.ai_description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow flex items-center justify-center h-64 text-gray-400">
              Select a dataset to view its details and dictionary
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
