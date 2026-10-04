import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { AuthService } from '@core/auth/auth.service';

@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  private readonly expectedRoles = signal<string[]>([]);
  private isCreated = false;

  @Input() set appHasRole(roles: string[] | string) {
    const roleList = Array.isArray(roles) ? roles : [roles];
    this.expectedRoles.set(roleList);
  }

  constructor() {
    effect(() => {
      const allowed = this.expectedRoles();
      const userRoles = this.authService.userRoles();

      const hasPermission =
        allowed.length === 0 || allowed.some((role) => userRoles.includes(role));

      if (hasPermission && !this.isCreated) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.isCreated = true;
      } else if (!hasPermission && this.isCreated) {
        this.viewContainer.clear();
        this.isCreated = false;
      }
    });
  }
}
