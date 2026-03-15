/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Settings } from './settings.js';

describe('Settings - Global Types Deletion', () => {
  beforeEach(() => {
    vi.stubGlobal('API_URL', 'http://localhost:3001/api');
    vi.stubGlobal('confirmAction', vi.fn().mockResolvedValue(true));
    vi.stubGlobal('init', vi.fn().mockResolvedValue(true));
    vi.stubGlobal('showAlert', vi.fn().mockResolvedValue(true));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    }));
  });

  it('calls delete API and init when account type is deleted', async () => {
    await Settings.handleDeleteType('account', 'Personal');

    expect(window.confirmAction).toHaveBeenCalledWith(expect.stringContaining('delete this type'));
    expect(window.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/account-types/Personal',
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(window.init).toHaveBeenCalled();
  });

  it('calls delete API and init when asset type is deleted', async () => {
    await Settings.handleDeleteType('asset', 'Real Estate');

    expect(window.confirmAction).toHaveBeenCalledWith(expect.stringContaining('delete this type'));
    expect(window.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/asset-types/Real%20Estate',
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(window.init).toHaveBeenCalled();
  });

  it('shows error if delete fails', async () => {
    window.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'In use' })
    });

    await Settings.handleDeleteType('account', 'Personal');

    expect(window.showAlert).toHaveBeenCalledWith('In use');
    expect(window.init).not.toHaveBeenCalled();
  });
});
