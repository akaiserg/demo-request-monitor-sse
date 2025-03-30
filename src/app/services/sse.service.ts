import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

interface HttpMessage {
  url: string;
  status_code: number;
  proxy: boolean;
  request: {
    headers: Record<string, string>;
    body: any;
  };
  response: {
    headers: Record<string, string>;
    body: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SseService {
  private eventSource: EventSource | null = null;
  private messagesSubject = new Subject<HttpMessage>();

  messages$ = this.messagesSubject.asObservable();

  connect(): void {
    if (this.eventSource) {
      return;
    }

    console.log('Connecting to SSE server...');
    this.eventSource = new EventSource('http://localhost:3000/api/sse');

    this.eventSource.onopen = () => {
      console.log('SSE connection opened');
    };

    this.eventSource.onmessage = (event) => {
      console.log('Received SSE message:', event.data);
      try {
        const data = JSON.parse(event.data);
        console.log('Parsed message:', data);
        this.messagesSubject.next(data);
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      this.disconnect();
    };
  }

  disconnect(): void {
    if (this.eventSource) {
      console.log('Disconnecting from SSE server...');
      this.eventSource.close();
      this.eventSource = null;
    }
  }
} 