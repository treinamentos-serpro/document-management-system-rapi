import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { downloadDocument, listDocuments, uploadDocument } from './services/api.js';
import './App.css';

export default function App() {
  const [userId, setUserId] = useState('usuario-demo');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function loadDocuments() {
      setIsLoading(true);
      setError('');
      try {
        const result = await listDocuments(userId);
        if (isCurrent) setDocuments(result);
      } catch (requestError) {
        if (isCurrent) setError(requestError.message);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadDocuments();
    return () => { isCurrent = false; };
  }, [userId, refreshKey]);

  async function handleUpload(file) {
    setIsUploading(true);
    setError('');
    try {
      await uploadDocument(file, userId);
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(item) {
    setDownloadingId(item.id);
    setError('');
    try {
      const { blob, fileName } = await downloadDocument(item.id, userId);
      const downloadUrl = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || item.originalName;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">DMS / ARQUIVOS</p>
          <h1>Seus documentos</h1>
        </div>
        <label className="user-field">
          <span>Usuário</span>
          <input
            value={userId}
            maxLength={128}
            onChange={(event) => setUserId(event.target.value)}
            aria-label="Identificador do usuário"
          />
        </label>
      </header>

      {error && <p className="error-message" role="alert">{error}</p>}

      <section className="upload-section" aria-labelledby="upload-heading">
        <div className="section-heading">
          <span className="section-number">01</span>
          <h2 id="upload-heading">Adicionar arquivo</h2>
        </div>
        <UploadComponent onUpload={handleUpload} isUploading={isUploading} />
      </section>

      <section className="documents-section" aria-labelledby="documents-heading">
        <div className="section-heading">
          <span className="section-number">02</span>
          <h2 id="documents-heading">Biblioteca</h2>
          {!isLoading && <span className="document-count">{documents.length}</span>}
        </div>
        <DocumentList
          documents={documents}
          isLoading={isLoading}
          downloadingId={downloadingId}
          onDownload={handleDownload}
        />
      </section>
    </main>
  );
}
