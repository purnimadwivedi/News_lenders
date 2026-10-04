import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Editable list of topic chips. Type and press Enter or comma to add (pasting "a, b, c" adds three),
 * click a chip to edit it in place, × to remove it. Emits a new array on every change; the parent
 * decides when to persist.
 */
@Component({
  selector: 'app-topic-chips',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chips" [class.disabled]="disabled" (click)="focusAdd($event)">
      <ng-container *ngFor="let t of topics; let i = index">
        <input *ngIf="editingIndex === i; else chip" #editInput class="chip-edit" [(ngModel)]="editText"
               [style.width.ch]="editText.length + 2"
               (keydown.enter)="commitEdit(); $event.preventDefault()" (keydown.escape)="cancelEdit()"
               (blur)="commitEdit()" [attr.aria-label]="'Edit topic ' + t" />
        <ng-template #chip>
          <span class="chip">
            <button type="button" class="chip-label" (click)="startEdit(i)" [disabled]="disabled" title="Click to edit">{{ t }}</button>
            <button type="button" class="chip-remove" (click)="remove(i)" [disabled]="disabled" [attr.aria-label]="'Remove ' + t">×</button>
          </span>
        </ng-template>
      </ng-container>
      <input #addInput class="chip-add" [ngModel]="addText" (ngModelChange)="onAddText($event)"
             [placeholder]="topics.length ? 'Add a topic…' : placeholder"
             [disabled]="disabled" (keydown.enter)="addPending(); $event.preventDefault()" (blur)="addPending()"
             aria-label="Add a topic" />
    </div>
    <p *ngIf="notice" class="chips-notice">{{ notice }}</p>
  `,
  styles: [
    `
      .chips {
        display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
        min-height: 38px; padding: 5px 8px; box-sizing: border-box;
        border: 1px solid var(--border); border-radius: 8px; background: var(--surface, #fff); cursor: text;
      }
      .chips:focus-within { outline: 2px solid var(--primary); outline-offset: -1px; border-color: var(--primary); }
      .chips.disabled { background: #f3f4f6; cursor: not-allowed; }
      .chip {
        display: inline-flex; align-items: center; border-radius: 14px;
        background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; font-size: 12.5px; line-height: 1;
      }
      .chip button {
        all: unset; cursor: pointer; box-sizing: border-box;
      }
      .chip button:disabled { cursor: not-allowed; }
      .chip .chip-label { padding: 5px 4px 5px 10px; }
      .chip .chip-label:hover:not(:disabled) { text-decoration: underline; }
      .chip .chip-remove { padding: 5px 9px 5px 4px; font-size: 14px; color: #c2410c; }
      .chip .chip-remove:hover:not(:disabled) { color: var(--critical); }
      .chip .chip-label:focus-visible, .chip .chip-remove:focus-visible { outline: 2px solid var(--primary); border-radius: 10px; }
      .chip-edit, .chip-add {
        border: none; outline: none; background: transparent; padding: 4px 2px; font-size: 13px; min-height: 0; box-shadow: none;
      }
      .chip-edit { border-bottom: 1px solid var(--primary); border-radius: 0; min-width: 6ch; }
      .chip-add { flex: 1; min-width: 140px; }
      .chip-add:focus, .chip-edit:focus { outline: none; }
      .chips-notice { margin: 4px 0 0; font-size: 12px; color: #b45309; }
    `
  ]
})
export class TopicChipsComponent {
  @Input() topics: string[] = [];
  @Input() placeholder = 'Type a topic and press Enter';
  @Input() disabled = false;
  @Output() topicsChange = new EventEmitter<string[]>();

  @ViewChild('addInput') addInput?: ElementRef<HTMLInputElement>;
  @ViewChild('editInput') editInput?: ElementRef<HTMLInputElement>;

  addText = '';
  editText = '';
  editingIndex: number | null = null;
  notice = '';
  private noticeTimer?: ReturnType<typeof setTimeout>;

  focusAdd(event: MouseEvent) {
    if (event.target === event.currentTarget) this.addInput?.nativeElement.focus();
  }

  // Splitting on the value (not the comma key) also covers paste, autocomplete and IME input.
  onAddText(value: string) {
    if (!value.includes(',')) {
      this.addText = value;
      return;
    }
    const parts = value.split(',');
    const rest = parts.pop() || '';
    this.add(parts);
    // Re-set after a tick so the input shows the leftover text, not the stale comma-containing value.
    this.addText = value;
    setTimeout(() => (this.addText = rest));
  }

  addPending() {
    if (this.addText.trim()) this.add([this.addText]);
    this.addText = '';
  }

  startEdit(i: number) {
    if (this.disabled) return;
    this.editingIndex = i;
    this.editText = this.topics[i];
    setTimeout(() => this.editInput?.nativeElement.select());
  }

  commitEdit() {
    if (this.editingIndex === null) return;
    const i = this.editingIndex;
    const value = clean(this.editText);
    this.editingIndex = null;
    if (!value) return this.remove(i);
    if (value === this.topics[i]) return;
    if (this.topics.some((t, j) => j !== i && same(t, value))) return this.flash(`"${value}" is already in the list`);
    this.emit(this.topics.map((t, j) => (j === i ? value : t)));
  }

  cancelEdit() {
    this.editingIndex = null;
  }

  remove(i: number) {
    this.emit(this.topics.filter((_, j) => j !== i));
  }

  private add(raw: string[]) {
    const next = [...this.topics];
    const dupes: string[] = [];
    for (const r of raw) {
      const value = clean(r);
      if (!value) continue;
      if (next.some((t) => same(t, value))) dupes.push(value);
      else next.push(value);
    }
    if (dupes.length) this.flash(`Already in the list: ${dupes.join(', ')}`);
    if (next.length !== this.topics.length) this.emit(next);
  }

  private emit(next: string[]) {
    this.topics = next;
    this.topicsChange.emit(next);
  }

  private flash(msg: string) {
    this.notice = msg;
    clearTimeout(this.noticeTimer);
    this.noticeTimer = setTimeout(() => (this.notice = ''), 3000);
  }
}

// Quotes are stripped because the query builder wraps phrases in quotes itself.
function clean(s: string): string {
  return String(s || '').replace(/"/g, '').replace(/\s+/g, ' ').trim();
}

function same(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}
