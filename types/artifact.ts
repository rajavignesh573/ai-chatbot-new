export interface UIArtifact {
  documentId: string;
  content: string;
  kind: string;
  title: string;
  isVisible: boolean;
  status: 'idle' | 'streaming';
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  metadata?: any;
} 