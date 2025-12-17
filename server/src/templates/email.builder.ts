import fs from 'fs';
import path from 'path';

interface EmailTemplateData {
  [key: string]: string;
}

/**
 * Email template builder for rendering HTML email templates
 * Uses simple string replacement for template variables
 */
export class EmailBuilder {
  private static templatesCache: Map<string, string> = new Map();

  /**
   * Load and cache template from file
   */
  private static loadTemplate(templateName: string): string {
    if (this.templatesCache.has(templateName)) {
      return this.templatesCache.get(templateName)!;
    }

    const templatePath = path.join(__dirname, 'emails', `${templateName}.html`);
    const template = fs.readFileSync(templatePath, 'utf-8');
    this.templatesCache.set(templateName, template);
    return template;
  }

  /**
   * Replace template variables with actual data
   */
  private static render(template: string, data: EmailTemplateData): string {
    let rendered = template;
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, value);
    }
    return rendered;
  }

  /**
   * Render email verification template
   */
  static renderVerification(data: { verificationLink: string }): string {
    const template = this.loadTemplate('verification');
    return this.render(template, data);
  }

  /**
   * Render password reset template
   */
  static renderPasswordReset(data: { username: string; resetLink: string }): string {
    const template = this.loadTemplate('passwordReset');
    return this.render(template, data);
  }

  /**
   * Render welcome email template
   */
  static renderWelcome(data: { username: string; appUrl: string }): string {
    const template = this.loadTemplate('welcome');
    return this.render(template, data);
  }

  /**
   * Clear template cache (useful for development/testing)
   */
  static clearCache(): void {
    this.templatesCache.clear();
  }
}
