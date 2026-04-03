import { usePaperStore } from './stores/paperStore';
import { PaperUpload } from './components/PaperUpload';
import { AnalysisProgress } from './components/AnalysisProgress';
import { PaperViewer } from './components/PaperViewer';

export function PaperExplorer() {
  const { status } = usePaperStore();

  if (status === 'done') return <PaperViewer />;
  if (status === 'extracting' || status === 'analyzing') return <AnalysisProgress />;
  return <PaperUpload />;
}
