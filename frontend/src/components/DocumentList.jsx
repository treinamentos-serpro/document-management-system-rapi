import DownloadButton from './DownloadButton.jsx';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function DocumentList({ documents, isLoading, downloadingId, onDownload }) {
  if (isLoading) return <p className="list-message">Carregando documentos...</p>;
  if (documents.length === 0) return <p className="list-message">Nenhum documento enviado.</p>;

  return (
    <ul className="document-list">
      {documents.map((document) => (
        <li className="document-row" key={document.id}>
          <div className="document-mark" aria-hidden="true">DOC</div>
          <div className="document-details">
            <strong title={document.originalName}>{document.originalName}</strong>
            <span>{formatFileSize(document.size)} <span className="detail-divider">/</span> {formatDate(document.uploadedAt)}</span>
          </div>
          <DownloadButton
            document={document}
            onDownload={onDownload}
            isLoading={downloadingId === document.id}
          />
        </li>
      ))}
    </ul>
  );
}