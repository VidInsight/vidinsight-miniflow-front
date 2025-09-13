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
    <div className="min-h-screen p-8 bg-gray-900">
  {/* Header */}
  <header className="mb-8 text-center">
    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 drop-shadow-lg">
      File Management Dashboard
    </h1>
    <p className="mt-2 text-gray-300 text-lg">Manage your files efficiently with modern tools</p>
  </header>

  {/* Error Message */}
  {error && (
    <div className="mb-4 p-4 bg-red-900/30 border-l-4 border-red-500 text-red-300 rounded-lg shadow-md">
      {error}
    </div>
  )}

  {/* Success Message */}
  {success && (
    <div className="mb-4 p-4 bg-green-900/30 border-l-4 border-green-500 text-green-300 rounded-lg shadow-md">
      {success}
    </div>
  )}

  {/* Upload Area */}
  <div
    className={`relative border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-300 mb-10 ${
      uploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
    } ${dragActive ? 'border-purple-400 bg-purple-900/10 shadow-inner' : 'border-gray-700 bg-gray-800'} flex flex-col items-center justify-center`}
    onDragEnter={!uploading ? handleDrag : undefined}
    onDragLeave={!uploading ? handleDrag : undefined}
    onDragOver={!uploading ? handleDrag : undefined}
    onDrop={!uploading ? handleDrop : undefined}
  >
    <div className="flex flex-col items-center">
      {uploading ? (
        <Loader2 className="h-14 w-14 mb-4 text-purple-400 animate-spin" />
      ) : (
        <Upload className="h-14 w-14 mb-4 text-purple-300" />
      )}
      <p className="text-xl font-semibold mb-2 text-gray-200">
        {uploading
          ? 'Uploading files...'
          : dragActive
          ? 'Drop your files here'
          : 'Drag & drop your files'}
      </p>
      <p className="text-sm text-gray-400 mb-4">or</p>
      <label
        htmlFor="fileInput"
        className="cursor-pointer px-6 py-3 bg-purple-600 text-white font-medium rounded-full hover:bg-purple-700 transition"
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

    {dragActive && !uploading && (
      <div className="absolute inset-0 bg-purple-900/20 rounded-3xl pointer-events-none transition-opacity duration-300" />
    )}
  </div>

  {/* Files Table */}
  {loading ? (
    <div className="flex justify-center items-center py-12">
      <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
      <span className="ml-3 text-gray-400 text-lg">Loading files...</span>
    </div>
  ) : (
    <table className="w-full bg-gray-800 shadow-lg rounded-2xl overflow-hidden border-collapse">
      <thead className="bg-gray-900">
        <tr>
          {['File', 'Size', 'Type', 'Status', 'Uploaded', 'Actions'].map((header) => (
            <th key={header} className="p-4 text-left text-gray-300 font-semibold tracking-wide">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {files.length === 0 ? (
          <tr>
            <td colSpan="6" className="p-8 text-center text-gray-500 italic">
              No files uploaded yet
            </td>
          </tr>
        ) : (
          files.map((file) => (
            <tr key={file.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors duration-200">
              <td className="p-4 flex items-center gap-3 text-gray-200">
                <span className="text-2xl">{getFileIcon(file.file_extension)}</span>
                <span className="font-medium">{file.name}</span>
              </td>
              <td className="p-4 text-gray-400">{formatFileSize(file.file_size)}</td>
              <td className="p-4 text-gray-400">{file.file_extension}</td>
              <td className="p-4">
                <button
                  onClick={() => toggleTemporary(file.id)}
                  className={`px-4 py-1 rounded-full text-white text-sm transition-colors duration-200 ${
                    file.is_temporary ? "bg-gray-500 hover:bg-gray-600" : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {file.is_temporary ? "Temporary" : "Permanent"}
                </button>
              </td>
              <td className="p-4 text-gray-400">{new Date(file.created_at).toLocaleDateString()}</td>
              <td className="p-4 text-right flex justify-end gap-3">
                <button
                  onClick={() => setSelectedFile(file)}
                  className="p-2 text-purple-400 hover:bg-purple-700/30 rounded transition"
                  title="View"
                >
                  <Eye className="h-5 w-5" />
                </button>
                <button
                  className="p-2 text-green-400 hover:bg-green-700/30 rounded transition"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={() => deleteFile(file.id)}
                  className="p-2 text-red-400 hover:bg-red-700/30 rounded transition"
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
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-xl w-full max-w-md relative overflow-hidden">
        <button
          onClick={() => setSelectedFile(null)}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-200 transition"
          title="Close"
        >
          <XCircle className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-4 p-6 border-b border-gray-700">
          <span className="text-4xl text-purple-400">{getFileIcon(selectedFile.file_extension)}</span>
          <h2 className="text-2xl font-semibold text-gray-200 truncate">{selectedFile.name}</h2>
        </div>

        <div className="p-6 space-y-4 text-gray-300">
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

          <div className="mt-4 flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition">
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
