/* Глоссарий RU - EN. */
(function () {
  const QA = window.QA;
  QA.pages = QA.pages || {};

  QA.pages.glossary = function () {
    const ui = QA.ui;
    const items = QA.data.glossary.slice().sort((a, b) => a.ru.localeCompare(b.ru, 'ru'));
    const rows = items
      .map(
        (g) =>
          '<tr><td><b>' + ui.esc(g.ru) + '</b></td><td class="en">' + ui.esc(g.en) + '</td><td>' + ui.esc(g.note || '') + '</td></tr>'
      )
      .join('');

    ui.render(
      '<h1>Глоссарий RU / EN</h1>' +
        '<p class="lead">Термины продублированы по-английски: на собеседовании в международную компанию их спросят именно так.</p>' +
        '<div class="form-row"><input id="gl-filter" placeholder="Фильтр по термину..."></div>' +
        '<div class="tw"><table id="gl-table"><thead><tr><th>Русский</th><th>English</th><th>Комментарий</th></tr></thead><tbody>' +
        (rows || '<tr><td colspan="3" class="muted">Глоссарий пока пуст.</td></tr>') +
        '</tbody></table></div>'
    );

    const f = document.getElementById('gl-filter');
    if (f) {
      f.oninput = () => {
        const v = f.value.toLowerCase();
        document.querySelectorAll('#gl-table tbody tr').forEach((tr) => {
          tr.hidden = v && !tr.textContent.toLowerCase().includes(v);
        });
      };
    }
  };
})();
