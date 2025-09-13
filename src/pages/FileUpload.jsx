import { useState, useEffect } from "react";
import { Upload, File, Trash2, Download, Eye, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { apiService } from "../services/api";

export default function FileUpload() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load files from API on component mount
  useEffect(() => {
    loadFiles();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getFiles();
      if (response.success) {
        setFiles(response.files);
      }
    } catch (err) {
      console.error('Error loading files:', err);
      setError('Dosyalar yüklenirken hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (extension) => {
    const iconMap = {
      '.pdf': '📄',
      '.json': '📋',
      '.txt': '📝',
      '.csv': '📊',
      '.jpg': '🖼️',
      '.jpeg': '🖼️',
      '.png': '🖼️',
      '.img': '🖼️'
    };
    return iconMap[extension] || '📎';
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileUpload = async (fileList) => {
    const filesToUpload = Array.from(fileList);
    
    if (filesToUpload.length === 0) return;

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      // Upload files one by one
      for (const file of filesToUpload) {
        try {
          const response = await apiService.uploadFile(file, true); // Default to temporary
          if (response.success) {
            setFiles(prev => [...prev, response.file]);
            setSuccess(`${file.name} başarıyla yüklendi`);
          }
        } catch (err) {
          console.error(`Error uploading ${file.name}:`, err);
          setError(`${file.name} yüklenirken hata oluştu: ${err.message}`);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileId) => {
    try {
      setError(null);
      const response = await apiService.deleteFile(fileId);
      if (response.success) {
        setFiles(prev => prev.filter(file => file.id !== fileId));
        setSuccess('Dosya başarıyla silindi');
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Dosya silinirken hata oluştu: ' + err.message);
    }
  };

  const toggleTemporary = async (fileId) => {
    try {
      setError(null);
      const file = files.find(f => f.id === fileId);
      if (!file) return;

      const newTemporaryStatus = !file.is_temporary;
      const response = await apiService.updateFileStatus(fileId, newTemporaryStatus);
      
      if (response.success) {
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, is_temporary: newTemporaryStatus, updated_at: new Date().toISOString() }
            : f
        ));
        setSuccess(`Dosya durumu ${newTemporaryStatus ? 'geçici' : 'kalıcı'} olarak güncellendi`);
      }
    } catch (err) {
      console.error('Error updating file status:', err);
      setError('Dosya durumu güncellenirken hata oluştu: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
  <h1 className="text-3xl font-bold mb-6 text-gray-800">File Management</h1>

  {/* Error Message */}
  {error && (
    <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-sm">
      {error}
    </div>
  )}

  {/* Success Message */}
  {success && (
    <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded shadow-sm">
      {success}
    </div>
  )}

  {/* Upload Area */}
  {/* Upload Area */}
<div
  className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 mb-8 ${
    uploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
  } ${dragActive ? 'border-blue-400 bg-blue-50 shadow-inner' : 'border-gray-300 bg-white'} flex flex-col items-center justify-center`}
  onDragEnter={!uploading ? handleDrag : undefined}
  onDragLeave={!uploading ? handleDrag : undefined}
  onDragOver={!uploading ? handleDrag : undefined}
  onDrop={!uploading ? handleDrop : undefined}
>
  {/* Upload Icon */}
  <div className="flex flex-col items-center">
    {uploading ? (
      <Loader2 className="h-12 w-12 mb-4 text-blue-500 animate-spin" />
    ) : (
      <Upload className="h-12 w-12 mb-4 text-gray-400" />
    )}
    <p className="text-lg font-medium mb-2 text-gray-700">
      {uploading
        ? 'Uploading files...'
        : dragActive
        ? 'Drop your files here'
        : 'Drag & drop your files'}
    </p>
    <p className="text-sm text-gray-500 mb-4">
      or
    </p>
    <label
      htmlFor="fileInput"
      className="cursor-pointer px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
    >
      Select Files
    </label>
    <input
      id="fileInput"
      type="file"
      multiple
      disabled={uploading}
      onChange={(e) => handleFileUpload(e.target.files)}
      className="hidden"
    />
  </div>

  {/* Drag overlay effect */}
  {dragActive && !uploading && (
    <div className="absolute inset-0 bg-blue-100/50 rounded-2xl pointer-events-none transition-opacity duration-300" />
  )}
</div>


  {/* Files Table */}
  {loading ? (
    <div className="flex justify-center items-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <span className="ml-2 text-gray-600">Loading files...</span>
    </div>
  ) : (
    <table className="w-full bg-white shadow rounded-lg overflow-hidden border-collapse">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-3 text-left text-gray-600 font-medium">File</th>
          <th className="p-3 text-left text-gray-600 font-medium">Size</th>
          <th className="p-3 text-left text-gray-600 font-medium">Type</th>
          <th className="p-3 text-left text-gray-600 font-medium">Status</th>
          <th className="p-3 text-left text-gray-600 font-medium">Uploaded</th>
          <th className="p-3 text-right text-gray-600 font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        {files.length === 0 ? (
          <tr>
            <td colSpan="6" className="p-8 text-center text-gray-400 italic">
              No files uploaded yet
            </td>
          </tr>
        ) : (
          files.map((file) => (
            <tr key={file.id} className="border-b hover:bg-gray-50 transition-colors duration-200">
              <td className="p-3 flex items-center gap-3">
                <span className="text-2xl">{getFileIcon(file.file_extension)}</span>
                <span className="text-gray-700 font-medium">{file.name}</span>
              </td>
              <td className="p-3 text-gray-600">{formatFileSize(file.file_size)}</td>
              <td className="p-3 text-gray-600">{file.file_extension}</td>
              <td className="p-3">
                <button
                  onClick={() => toggleTemporary(file.id)}
                  className={`px-3 py-1 rounded-full text-white text-sm transition-colors duration-200 ${
                    file.is_temporary ? "bg-gray-400 hover:bg-gray-500" : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {file.is_temporary ? "Temporary" : "Permanent"}
                </button>
              </td>
              <td className="p-3 text-gray-600">{new Date(file.created_at).toLocaleDateString()}</td>
             <td className="p-3 text-right flex justify-end gap-2">
  <button
    onClick={() => setSelectedFile(file)}
    className="p-2 text-blue-500 hover:bg-blue-50 rounded transition"
    title="View"
  >
    <Eye className="h-5 w-5" />
  </button>
  <button
    className="p-2 text-green-500 hover:bg-green-50 rounded transition"
    title="Download"
  >
    <Download className="h-5 w-5" />
  </button>
  <button
    onClick={() => deleteFile(file.id)}
    className="p-2 text-red-500 hover:bg-red-50 rounded transition"
    title="Delete"
  >
    <Trash2 className="h-5 w-5" />
  </button>
</td>

            </tr>
          ))
        )}
      </tbody>
    </table>
  )}

  {/* File Detail Modal */}
  {selectedFile && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative overflow-hidden">
      
      {/* Close Button */}
      <button
        onClick={() => setSelectedFile(null)}
        className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 transition"
        title="Close"
      >
        <XCircle className="h-6 w-6" />
      </button>

      {/* Modal Header */}
      <div className="flex items-center gap-4 p-6 border-b border-gray-200">
        <span className="text-4xl">{getFileIcon(selectedFile.file_extension)}</span>
        <h2 className="text-2xl font-semibold text-gray-800 truncate">{selectedFile.name}</h2>
      </div>

      {/* Modal Content */}
      <div className="p-6 space-y-4 text-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <p className="font-medium">Type:</p>
          <p>{selectedFile.mime_type}</p>

          <p className="font-medium">Size:</p>
          <p>{formatFileSize(selectedFile.file_size)}</p>

          <p className="font-medium">Status:</p>
          <p>{selectedFile.is_temporary ? "Temporary" : "Permanent"}</p>

          <p className="font-medium">Checksum:</p>
          <p className="break-all">{selectedFile.checksum}</p>

          <p className="font-medium">Path:</p>
          <p className="break-all">{selectedFile.file_path}</p>
        </div>

        {/* Download Button */}
        <div className="mt-4 flex justify-end">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition">
            <Download className="h-5 w-5" />
            Download
          </button>
        </div>
      </div>
    </div>
  </div>
)}

  
</div>

  );
}
