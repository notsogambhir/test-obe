'use client';

// Simple event emitter for cross-component communication
class CourseEventEmitter {
  private listeners: { [key: string]: (() => void)[] } = {};

  on(event: string, callback: () => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: () => void) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event: string) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback());
    }
  }
}

export const courseEvents = new CourseEventEmitter();