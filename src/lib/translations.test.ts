import { describe, it, expect } from 'vitest';
import { translations, generateWhatsAppReminder, REGIONAL_METADATA } from './translations';

describe('Trilingual Translations & Guwahati Local Touch', () => {
  it('contains valid translation dictionaries for en, hi, and as', () => {
    expect(translations.en).toBeDefined();
    expect(translations.hi).toBeDefined();
    expect(translations.as).toBeDefined();

    // Check key presence in all three languages
    const keysToCheck = [
      'app_title',
      'app_subtitle',
      'nav_members',
      'nav_chase',
      'nav_settings',
      'language_section_title',
      'chase_title'
    ];

    for (const key of keysToCheck) {
      expect(translations.en[key as keyof typeof translations.en]).toBeTruthy();
      expect(translations.hi[key as keyof typeof translations.hi]).toBeTruthy();
      expect(translations.as[key as keyof typeof translations.as]).toBeTruthy();
    }
  });

  it('contains correct Guwahati regional metadata', () => {
    expect(REGIONAL_METADATA.as.city).toBe('গুৱাহাটী');
    expect(REGIONAL_METADATA.as.state).toBe('অসম');
    expect(REGIONAL_METADATA.as.localGreeting).toContain('নমস্কাৰ গুৱাহাটী');

    expect(REGIONAL_METADATA.hi.city).toBe('गुवाहाटी');
    expect(REGIONAL_METADATA.hi.state).toBe('असम');

    expect(REGIONAL_METADATA.en.city).toBe('Guwahati');
    expect(REGIONAL_METADATA.en.state).toBe('Assam');
  });

  it('generates authentic Assamese reminder message with Guwahati touch', () => {
    const msgDueSoon = generateWhatsAppReminder('as', 'ৰাহুল', '2026-10-15', -3, 'Gym Addict 2.0');
    expect(msgDueSoon).toContain('নমস্কাৰ ৰাহুল');
    expect(msgDueSoon).toContain('গুৱাহাটী');
    expect(msgDueSoon).toContain('2026-10-15');
    expect(msgDueSoon).toContain('ধন্যবাদ');

    const msgToday = generateWhatsAppReminder('as', 'ৰাহুল', '2026-10-15', 0, 'Gym Addict 2.0');
    expect(msgToday).toContain('আজি');

    const msgOverdue = generateWhatsAppReminder('as', 'ৰাহুল', '2026-10-15', 4, 'Gym Addict 2.0');
    expect(msgOverdue).toContain('দিন পলম');
  });

  it('generates Hindi reminder message with Guwahati touch', () => {
    const msg = generateWhatsAppReminder('hi', 'राहुल', '2026-10-15', 0, 'Gym Addict 2.0');
    expect(msg).toContain('नमस्ते राहुल');
    expect(msg).toContain('गुवाहाटी');
    expect(msg).toContain('आज');
  });

  it('generates English reminder message with Guwahati touch', () => {
    const msg = generateWhatsAppReminder('en', 'Rahul', '2026-10-15', -2, 'Gym Addict 2.0');
    expect(msg).toContain('Hi Rahul');
    expect(msg).toContain('Guwahati');
    expect(msg).toContain('in 2 days');
  });
});
