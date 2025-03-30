import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { SseService } from './services/sse.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

interface HttpMessage {
  id: number;
  timestamp: Date;
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

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatExpansionModule,
    MatChipsModule,
    MatInputModule,
    FormsModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="container">
      <mat-card class="sse-card">
        <mat-card-header>
          <mat-card-title>HTTP Request/Response Monitor (SSE)</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="controls">
            <button mat-raised-button color="primary" (click)="startSSE()" [disabled]="isConnected">
              <mat-icon>play_arrow</mat-icon>
              Start Monitoring
            </button>
            <button mat-raised-button color="warn" (click)="stopSSE()" [disabled]="!isConnected">
              <mat-icon>stop</mat-icon>
              Stop Monitoring
            </button>
            <button mat-raised-button color="accent" (click)="clearMessages()" [disabled]="messages.length === 0">
              <mat-icon>clear_all</mat-icon>
              Clear Messages
            </button>
          </div>
          
          <div class="status" [class.connected]="isConnected">
            Status: {{ isConnected ? 'Connected' : 'Disconnected' }}
          </div>

          <div class="message-count" *ngIf="messages.length > 0">
            Messages received: {{ messages.length }}
          </div>

          <div class="search-container" *ngIf="!isConnected && messages.length > 0">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search messages</mat-label>
              <input 
                matInput 
                [(ngModel)]="searchText" 
                (keyup.enter)="searchMessages()"
                placeholder="Enter search text..."
              >
              <button 
                mat-icon-button 
                matSuffix 
                (click)="searchMessages()"
                [disabled]="!searchText"
              >
                <mat-icon>search</mat-icon>
              </button>
            </mat-form-field>
            <button 
              mat-button 
              color="primary" 
              (click)="clearSearch()"
              *ngIf="searchText"
            >
              Clear Search
            </button>
          </div>

          <div class="two-column-layout">
            <!-- Left Column: Message List -->
            <div class="message-list-column">
              <div class="message-list">
                @for (message of filteredMessages; track message.id) {
                  <div 
                    class="message-item" 
                    [class.selected]="selectedMessage?.id === message.id"
                    (click)="selectMessage(message)"
                  >
                    <div class="message-header">
                      <span class="method">{{ message.url.split(' ')[0] }}</span>
                      <span class="url">{{ message.url.split(' ')[1] }}</span>
                      <span class="source-label" [class.proxy]="message.proxy" [class.stub]="!message.proxy">
                        {{ message.proxy ? 'proxy' : 'stub' }}
                      </span>
                      <mat-chip [color]="getStatusColor(message.status_code)" selected>
                        {{ message.status_code }}
                      </mat-chip>
                      <span class="timestamp">{{ message.timestamp | date:'medium' }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Right Column: Message Details -->
            <div class="message-details-column">
              @if (selectedMessage) {
                <div class="message-details">
                  <div class="message-header-section">
                    <div class="header-row">
                      <div class="header-item">
                        <span class="label">Method:</span>
                        <span class="value method">{{ selectedMessage.url.split(' ')[0] }}</span>
                      </div>
                      <div class="header-item">
                        <span class="label">URL:</span>
                        <span class="value url">{{ selectedMessage.url.split(' ')[1] }}</span>
                      </div>
                    </div>
                    <div class="header-row">
                      <div class="header-item">
                        <span class="label">Status:</span>
                        <mat-chip [color]="getStatusColor(selectedMessage.status_code)" selected>
                          {{ selectedMessage.status_code }}
                        </mat-chip>
                      </div>
                      <div class="header-item">
                        <span class="label">Source:</span>
                        <span class="source-label" [class.proxy]="selectedMessage.proxy" [class.stub]="!selectedMessage.proxy">
                          {{ selectedMessage.proxy ? 'proxy' : 'stub' }}
                        </span>
                      </div>
                      <div class="header-item">
                        <span class="label">Date:</span>
                        <span class="value">{{ selectedMessage.timestamp | date:'medium' }}</span>
                      </div>
                    </div>
                    <div class="header-actions">
                      <button 
                        mat-raised-button 
                        color="primary" 
                        (click)="copyMessageToClipboard()"
                        class="copy-button"
                      >
                        <mat-icon>content_copy</mat-icon>
                        Copy JSON
                      </button>
                    </div>
                  </div>

                  <div class="section">
                    <h3>Request</h3>
                    <div class="headers">
                      <h4>Headers:</h4>
                      <pre>{{ selectedMessage.request.headers | json }}</pre>
                    </div>
                    <div class="body">
                      <h4>Body:</h4>
                      <pre>{{ selectedMessage.request.body | json }}</pre>
                    </div>
                  </div>

                  <div class="section">
                    <h3>Response</h3>
                    <div class="headers">
                      <h4>Headers:</h4>
                      <pre>{{ selectedMessage.response.headers | json }}</pre>
                    </div>
                    <div class="body">
                      <h4>Body:</h4>
                      <pre>{{ selectedMessage.response.body | json }}</pre>
                    </div>
                  </div>
                </div>
              } @else {
                <div class="no-selection">
                  <mat-icon>info</mat-icon>
                  <p>Select a message to view its details</p>
                </div>
              }
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1600px;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    .sse-card {
      margin-bottom: 1rem;
    }

    .controls {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .status {
      padding: 0.5rem;
      margin-bottom: 1rem;
      border-radius: 4px;
      background-color: #f5f5f5;
      text-align: center;
      font-weight: 500;
    }

    .status.connected {
      background-color: #e8f5e9;
      color: #2e7d32;
    }

    .message-count {
      text-align: right;
      color: #666;
      margin-bottom: 1rem;
    }

    .search-container {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1rem;
    }

    .search-field {
      flex: 1;
    }

    .two-column-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      height: calc(100vh - 300px);
    }

    .message-list-column {
      border-right: 1px solid #e0e0e0;
      overflow-y: auto;
    }

    .message-details-column {
      overflow-y: auto;
      padding: 1rem;
    }

    .message-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .message-item {
      padding: 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
      font-size: 0.85rem;
    }

    .message-item:hover {
      background-color: #f5f5f5;
    }

    .message-item.selected {
      background-color: #e3f2fd;
    }

    .message-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .method {
      font-weight: bold;
      color: #1976d2;
      font-size: 0.8rem;
    }

    .url {
      color: #666;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 0.8rem;
    }

    .source-label {
      font-size: 0.7rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 500;
    }

    .source-label.proxy {
      background-color: #e8f5e9;
      color: #2e7d32;
    }

    .source-label.stub {
      background-color: #fff3e0;
      color: #e65100;
    }

    .timestamp {
      color: #999;
      font-size: 0.75rem;
    }

    .message-details {
      .message-header-section {
        background-color: #f8f9fa;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1.5rem;
      }

      .header-row {
        display: flex;
        gap: 2rem;
        margin-bottom: 0.5rem;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .header-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .label {
          color: #666;
          font-weight: 500;
        }

        .value {
          color: #333;
          font-weight: 500;

          &.method {
            color: #1976d2;
          }

          &.url {
            color: #666;
          }
        }
      }
    }

    .section {
      margin-bottom: 1.5rem;
      background-color: white;
      padding: 1rem;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .section h3 {
      margin: 0 0 0.5rem 0;
      color: #1976d2;
    }

    .section h4 {
      margin: 0.5rem 0;
      color: #666;
    }

    pre {
      background-color: #f5f5f5;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      margin: 0;
    }

    .no-selection {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #666;
      
      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 1rem;
      }
    }

    .header-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;
    }

    .copy-button {
      font-size: 0.9rem;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  private sseService = inject(SseService);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);
  
  messages: HttpMessage[] = [];
  filteredMessages: HttpMessage[] = [];
  isConnected = false;
  selectedMessage: HttpMessage | null = null;
  searchText = '';

  ngOnInit(): void {
    console.log('AppComponent initialized');
    this.sseService.messages$.subscribe({
      next: (message) => {
        console.log('Received message in component:', message);
        this.messages = [{
          id: Date.now(),
          timestamp: new Date(),
          ...message
        }, ...this.messages];
        this.filteredMessages = this.messages;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error in message subscription:', error);
      }
    });
  }

  getStatusColor(status: number): string {
    if (status >= 200 && status < 300) return 'primary';
    if (status >= 400 && status < 500) return 'warn';
    if (status >= 500) return 'accent';
    return 'primary';
  }

  selectMessage(message: HttpMessage): void {
    this.selectedMessage = message;
    this.cdr.detectChanges();
  }

  startSSE(): void {
    console.log('Starting SSE connection...');
    this.sseService.connect();
    this.isConnected = true;
    this.searchText = '';
    this.filteredMessages = this.messages;
    this.cdr.detectChanges();
  }

  stopSSE(): void {
    console.log('Stopping SSE connection...');
    this.sseService.disconnect();
    this.isConnected = false;
    this.cdr.detectChanges();
  }

  clearMessages(): void {
    console.log('Clearing messages...');
    this.messages = [];
    this.filteredMessages = [];
    this.selectedMessage = null;
    this.searchText = '';
    this.cdr.detectChanges();
  }

  searchMessages(): void {
    if (!this.searchText.trim()) {
      this.filteredMessages = this.messages;
      return;
    }

    const searchLower = this.searchText.toLowerCase();
    this.filteredMessages = this.messages.filter(message => {
      const method = message.url.split(' ')[0].toLowerCase();
      const url = message.url.split(' ')[1].toLowerCase();
      const status = message.status_code.toString();
      const source = message.proxy ? 'proxy' : 'stub';
      const timestamp = message.timestamp.toString().toLowerCase();

      return method.includes(searchLower) ||
             url.includes(searchLower) ||
             status.includes(searchLower) ||
             source.includes(searchLower) ||
             timestamp.includes(searchLower);
    });
  }

  clearSearch(): void {
    this.searchText = '';
    this.filteredMessages = this.messages;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    console.log('AppComponent destroying...');
    this.sseService.disconnect();
  }

  copyMessageToClipboard(): void {
    if (this.selectedMessage) {
      const messageJson = JSON.stringify(this.selectedMessage, null, 2);
      navigator.clipboard.writeText(messageJson).then(
        () => {
          this.snackBar.open('Message copied to clipboard', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: 'success-snackbar'
          });
        },
        (err) => {
          this.snackBar.open('Failed to copy message', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: 'error-snackbar'
          });
          console.error('Failed to copy message:', err);
        }
      );
    }
  }
} 