export default function DownloadButton({ document, onDownload, isLoading }) {
  return (
    <button
      className="download-button"
      type="button"
      onClick={() => onDownload(document)}
      disabled={isLoading}
      aria-label={`Baixar ${document.originalName}`}
      title="Baixar documento"
    >
      {isLoading ? 'Baixando...' : 'Baixar'}
    </button>
  );
}