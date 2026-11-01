import { describe, expect, it } from 'vitest';
import { builtins, makePopup, nodes } from './harness.js';

describe('Issue #659: stale popup cache must not break CSP rendering', () => {
    it.each(['lite', 'omni'])('renders built-in tools using current metadata in %s mode', async mode => {
        const { popup } = makePopup({ cache: JSON.stringify({ tools: {
            'json-format': { installed: true, name: 'Old JSON' },
            timestamp: { installed: true, name: { toString: 'obsolete metadata' } },
            removed: { installed: true, name: 'Removed tool' }
        } }) });
        popup.uiMode = mode;
        popup.recentUsed = ['json-format'];
        popup.applyCachedTools();
        await popup.$nextTick();
        const tree = popup._render();
        expect(tree.tag).toBe('div');
        expect(nodes(tree, 'fh-tool-row')).toHaveLength(2);
        expect(popup.fhTools.timestamp.name).toBe(builtins.timestamp.name);
        expect(popup.fhTools.removed).toBeUndefined();
    });

    it.each([[], 'stale', { timestamp: null }, { missing: { installed: true } }])(
        'falls back to the system tool for malformed cache %j', tools => {
            const { popup } = makePopup({ cache: JSON.stringify({ tools }) });
            popup.applyCachedTools();
            expect(popup.installedTools.map(tool => tool.key)).toEqual(['json-format']);
            expect(nodes(popup._render(), 'fh-tool-row')).toHaveLength(1);
        });

    it('keeps valid custom tools and their dynamic-page routing metadata', () => {
        const { popup } = makePopup({ cache: JSON.stringify({ tools: {
            custom: { installed: true, _devTool: true, _enable: true, name: 'Local tool', tips: 'Offline', noPage: false },
            disabled: { installed: true, _devTool: true, _enable: false, name: 'Disabled' }
        } }) });
        popup.applyCachedTools();
        expect(popup.installedTools.map(tool => tool.key)).toEqual(['custom']);
        expect(popup.fhTools.custom._devTool).toBe(true);
    });
});
