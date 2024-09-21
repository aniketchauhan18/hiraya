export interface ChatMessage {
  text: string;
  isUser: boolean;
}

export interface AuthSearchPageProps {
  searchParams: {
    redirect?: string;
  };
}