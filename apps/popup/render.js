/**
 * Explicit render functions keep the popup compatible with extension CSP.
 * Preserve the existing popup structure and styling without runtime compilation.
 */
export default function renderPopup(h) {
    const isLite = this.uiMode === 'lite';
    const button = (label, className, click, data = {}) => h('button', {
        ...data,
        class: className,
        attrs: {type: 'button', ...data.attrs},
        on: {click, ...data.on}
    }, [label]);
    const mark = className => h('img', {
        class: className,
        attrs: {src: '../static/img/fe-48.png', alt: '', 'aria-hidden': 'true'}
    });
    const header = h('header', {class: 'fh-header'}, [
        h('div', {class: 'fh-brand'}, [
            mark('fh-brand-mark'),
            h('div', {class: 'fh-brand-copy'}, [
                h('strong', ['FeHelper']),
                h('span', [`v${this.manifest.version || '-'}`])
            ])
        ]),
        h('div', {class: 'fh-header-meta'}, [
            h('div', {
                class: 'fh-mode-switch',
                attrs: {role: 'group', 'aria-label': 'FeHelper 模式切换'}
            }, ['lite', 'omni'].map(mode => button(
                mode === 'lite' ? 'Lite' : 'Omni',
                ['fh-mode-pill', {'is-active': this.uiMode === mode}],
                () => this.setUiMode(mode)
            )))
        ])
    ]);
    const search = isLite ? null : h('div', {class: 'fh-search'}, [
        h('span', {class: 'fh-search-icon', attrs: {'aria-hidden': 'true'}}),
        h('input', {
            ref: 'searchInput',
            class: 'fh-search-input',
            attrs: {
                type: 'search', placeholder: '搜索工具、命令或用途',
                autocomplete: 'off', spellcheck: 'false', 'aria-label': '搜索 FeHelper 工具'
            },
            domProps: {value: this.searchKey},
            on: {
                input: event => {
                    if (!event.target.composing) {
                        this.searchKey = event.target.value.trim();
                    }
                    this.syncActiveTool();
                },
                compositionstart: event => { event.target.composing = true; },
                compositionend: event => {
                    if (!event.target.composing) return;
                    event.target.composing = false;
                    event.target.dispatchEvent(new window.Event('input', {bubbles: true}));
                },
                blur: () => this.$forceUpdate()
            }
        }),
        h('kbd', ['/'])
    ]);

    let content;
    if (this.isLoading) {
        content = h('div', {class: 'fh-loading', attrs: {'aria-live': 'polite'}}, [
            h('div', {class: 'fh-skeleton -title'}),
            ...[0, 1, 2].map(() => h('div', {class: 'fh-skeleton -row'}))
        ]);
    } else if (this.installedToolsCount === 0) {
        content = h('div', {class: 'fh-empty'}, [
            mark('fh-empty-mark'),
            h('strong', ['还没有安装工具']),
            h('p', ['进入工具库安装常用工具后，这里会变成你的快捷入口。']),
            button('打开工具库', 'fh-primary-button', this.openOptionsPage)
        ]);
    } else {
        const groups = this.flatVisibleTools.length === 0 ? [
            h('div', {class: 'fh-empty -compact'}, [
                h('strong', ['没有匹配的工具']),
                h('p', ['换一个关键词，或者去工具库查看完整列表。'])
            ])
        ] : this.visibleGroups.map(group => h('section', {
            key: group.key,
            class: ['fh-section', {'is-lite-flat': isLite}]
        }, [
            h('div', {class: 'fh-section-title'}, [
                h('span', [group.title]), h('span', [group.countLabel])
            ]),
            ...group.tools.map(tool => {
                const shortcut = this.getShortcut(tool.key);
                return h('button', {
                    key: group.key + '-' + tool.key,
                    class: ['fh-tool-row', {'is-active': tool.key === this.activeToolKey}],
                    attrs: {
                        type: 'button', role: 'option',
                        'aria-selected': tool.key === this.activeToolKey ? 'true' : 'false'
                    },
                    on: {
                        click: () => this.runHelper(tool.key),
                        mouseenter: () => this.handleToolHover(tool.key)
                    }
                }, [
                    h('span', {class: 'fh-tool-badge', attrs: {'aria-hidden': 'true'}}, [tool.badge]),
                    h('span', {class: 'fh-tool-copy'}, [
                        h('strong', [tool.name]), h('small', [tool.shortTips])
                    ]),
                    h('span', {class: 'fh-tool-meta'}, [
                        tool.favorite ? h('span', {class: 'fh-favorite-label'}, ['收藏']) : null,
                        shortcut ? h('kbd', {attrs: {title: this.getShortcutTitle(tool.key)}}, [shortcut]) : null
                    ])
                ]);
            })
        ]));
        content = h('main', {
            class: 'fh-command-list', attrs: {role: 'listbox', 'aria-label': 'FeHelper工具列表'}
        }, groups);
    }

    const footer = h('footer', {class: 'fh-footer'}, [
        h('span', [isLite ? 'Enter 打开' : '↑↓ 选择 · Enter 打开']),
        h('nav', {attrs: {'aria-label': 'FeHelper快捷操作'}}, [
            button(isLite ? '更多' : '工具库', null, this.openOptionsPage),
            button('设置', null, this.openOptionsPage),
            h('a', {
                attrs: {href: 'https://github.com/zxlie/FeHelper/issues', target: '_blank'},
                on: {click: this.openUrl}
            }, ['反馈'])
        ])
    ]);

    return h('div', {
        attrs: {id: 'pageContainer'}, class: ['fh-popup', this.getLayoutClasses()]
    }, [header, search, content, footer]);
}
