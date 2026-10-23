import { Directive, ElementRef, Input, OnInit, OnDestroy, Renderer2 } from '@angular/core';

export type ScrollAnimationType = 
  | 'fade-up' 
  | 'fade-down' 
  | 'fade-left' 
  | 'fade-right' 
  | 'zoom-in' 
  | 'flip-up'
  | 'fade';

@Directive({
  selector: '[appScrollAnimate]',
  standalone: true
})
export class ScrollAnimateDirective implements OnInit, OnDestroy {
  @Input('appScrollAnimate') animationType: ScrollAnimationType = 'fade-up';
  @Input() animDelay: number = 0; // Delay in milliseconds
  @Input() animDuration: number = 700; // Duration in milliseconds
  @Input() animThreshold: number = 0.12; // Visibility threshold before triggering
  @Input() animOnce: boolean = true; // Whether animation should only play once

  private observer: IntersectionObserver | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    const element = this.el.nativeElement;

    // Apply base reveal class and specific animation style
    this.renderer.addClass(element, 'scroll-reveal');
    this.renderer.addClass(element, `reveal-${this.animationType || 'fade-up'}`);

    if (this.animDelay > 0) {
      this.renderer.setStyle(element, 'transition-delay', `${this.animDelay}ms`);
    }

    if (this.animDuration !== 700) {
      this.renderer.setStyle(element, 'transition-duration', `${this.animDuration}ms`);
    }

    // Check if IntersectionObserver is supported
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.renderer.addClass(element, 'is-revealed');
              if (this.animOnce && this.observer) {
                this.observer.unobserve(element);
              }
            } else if (!this.animOnce) {
              this.renderer.removeClass(element, 'is-revealed');
            }
          });
        },
        {
          root: null, // viewport
          rootMargin: '0px 0px -40px 0px', // trigger slightly before bottom of screen
          threshold: this.animThreshold
        }
      );

      this.observer.observe(element);
    } else {
      // Fallback for older browsers: show element immediately
      this.renderer.addClass(element, 'is-revealed');
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
