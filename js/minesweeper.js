var minesweeper = new function ($) {
    var _wrapper;
    var _fieldElem;
    var _cells;
    var _field;
    var _cols;
    var _rows;
    var _mines;
    var _fieldsToReveal;
    var _mineCounter;
    var _mineCounterElem;
    var _timeCounter;
    var _timeCounterElem;
    var _timeIntervalId = -1;

    var _columnStyles = {};
    var _sizeStyles = {};
    var _resolutionStyles = {};

    var _newgameButton;

    var _clickTarget;
    var _clickButton;

    this.active = false;

    var _curLanguage = '';
    this.languages = {
        en: {
            time: 'Time',
            mines: 'Mines',
            newGame: 'New Game',
            easy: 'Easy',
            medium: 'Medium',
            hard: 'Hard',
            cols: 'Columns',
            rows: 'Rows',
            custom: 'Custom'
        },
        de: {
            time: 'Zeit',
            mines: 'Minen',
            newGame: 'Neues Spiel',
            easy: 'Leicht',
            medium: 'Mittel',
            hard: 'Schwer',
            cols: 'Spalten',
            rows: 'Zeilen',
            custom: 'Benutzerdefiniert'
        }
    };
    this.applyLanguage = function (lang) {
        if (typeof this.languages[lang] !== 'undefined') {
            _curLanguage = lang;

            _wrapper.find('.info .time .label').html(this.languages[lang].time);
            _wrapper.find('.info .mines .label').html(this.languages[lang].mines);
        }
    };

    var _getAdjacentCells = function (i) {
        var cells = [];
        var borders = {
            left: i % _cols === 0,
            right: i % _cols === _cols - 1,
            top: Math.floor(i / _cols) === 0,
            bottom: Math.floor(i / _cols) === _rows - 1
        };
        if (!borders.top) {
            cells.push(i - _cols);
            if (!borders.left) {
                cells.push(i - _cols - 1);
            }
            if (!borders.right) {
                cells.push(i - _cols + 1);
            }
        }
        if (!borders.bottom) {
            cells.push(i + _cols);
            if (!borders.left) {
                cells.push(i + _cols - 1);
            }
            if (!borders.right) {
                cells.push(i + _cols + 1);
            }
        }
        if (!borders.left) {
            cells.push(i - 1);
        }
        if (!borders.right) {
            cells.push(i + 1);
        }
        return cells;
    };

    var _win = function () {
        minesweeper.active = false;
        _newgameButton.attr('data-status', 'win');
        window.clearInterval(_timeIntervalId);
        _timeIntervalId = -1;
        for (var i = 0; i < _field.length; i++) {
            if (_cells[i].is('[data-concealed]') && _cells[i].attr('data-icon') !== 'flag') {
                _cells[i].attr('data-icon', 'flag');
                _mineCounter = 0;
                _mineCounterElem.html(minesweeper.padNumber(_mineCounter, 3));
            }
        }
    };

    var _lose = function (cell) {
        minesweeper.active = false;
        _newgameButton.attr('data-status', 'lose');
        window.clearInterval(_timeIntervalId);
        _timeIntervalId = -1;
        _cells[cell].attr('data-icon', 'mine');
        _cells[cell].attr('data-explode', '');
        var timeoutFunc = function (i) {
            var found = false;
            while (i < _field.length && !found) {
                found = i !== cell && _field[i] === 'mine' && _cells[i].attr('data-icon') !== 'flag';
                i++;
            }
            if (found) {
                _cells[i - 1].attr('data-icon', 'mine');
                _cells[i - 1].attr('data-explode', '');
                if (i < _field.length) {
                    window.setTimeout(timeoutFunc, 50, i);
                }
            }
            if (i === _field.length) {
                _newgameButton.removeAttr('disabled');
            }
        };
        _newgameButton.attr('disabled', '');
        window.setTimeout(timeoutFunc, 500, 0);
    };

    var _revealCell = function (i) {
        if (_field[i] !== 'mine' && _cells[i].is('[data-concealed]') && _cells[i].attr('data-icon') !== 'flag') {
            _cells[i].removeAttr('data-concealed');
            if (_field[i] > 0) {
                _cells[i].attr('data-icon', 'number');
                _cells[i].attr('data-number', _field[i]);
            } else {
                for (i of _getAdjacentCells(i)) {
                    _revealCell(i);
                }
            }
            _fieldsToReveal--;
            if (_fieldsToReveal === 0) {
                _win();
            }
        }
    };

    var _mouseDownHandler = function (e) {
        if (minesweeper.active) {
            var which = e.which === 3 ? 2 : (e.which === 1 ? 1 : 0);
            if (_clickTarget === e.data) {
                _clickButton |= which;
            } else if (_clickTarget === -1) {
                _clickTarget = e.data;
                _clickButton = which;
            } else if (which === 2) {
                _clickButton |= 2;
            } else {
                _clickTarget = -1;
                _clickButton = 0;
            }

            if (_clickTarget !== -1 && (_clickButton & 1) && _cells[_clickTarget].is('[data-concealed]') && _cells[_clickTarget].attr('data-icon') !== 'flag') {
                _cells[_clickTarget].removeAttr('data-concealed');
                _cells[_clickTarget].attr('data-clicked', '');
            }
        }
        e.preventDefault();
    };

    var _mouseUpHandler = function (e) {
        var which = e.which === 3 ? 2 : (e.which === 1 ? 1 : 0);
        if (minesweeper.active && _clickButton !== 0 && _clickTarget !== -1 && (which === 1 || which === 2)) {
            if (_cells[_clickTarget].is('[data-clicked]')) {
                _cells[_clickTarget].removeAttr('data-clicked');
                _cells[_clickTarget].attr('data-concealed', '');
            }

            if (_clickTarget === e.data && _clickButton & which) {
                if (_timeIntervalId === -1) {
                    _timeIntervalId = window.setInterval(function () {
                        if (_timeCounter < 999) {
                            _timeCounterElem.html(minesweeper.padNumber(++_timeCounter, 3));
                        }
                    }, 1000);
                }

                switch (_clickButton) {
                    case 1:
                        // left mouse button
                        if (_cells[e.data].is('[data-concealed]') && _cells[e.data].attr('data-icon') !== 'flag') {
                            if (_field[e.data] === 'mine') {
                                _lose(e.data);
                            } else {
                                _revealCell(e.data);
                            }
                        }
                        break;
                    case 2:
                        // right mouse button
                        if (_cells[e.data].is('[data-concealed]')) {
                            if (_cells[e.data].attr('data-icon') !== 'flag') {
                                _cells[e.data].attr('data-icon', 'flag');
                                _mineCounterElem.html(minesweeper.padNumber(--_mineCounter, 3));
                            } else {
                                _cells[e.data].removeAttr('data-icon');
                                _mineCounterElem.html(minesweeper.padNumber(++_mineCounter, 3));
                            }
                        }
                        break;
                    case 3:
                        // both mouse buttons
                        if (_field[e.data] === 'mine' && _cells[e.data].attr('data-icon') !== 'flag') {
                            _lose(e.data);
                        }

                        var cells = _getAdjacentCells(e.data);
                        cells.push(e.data);
                        var possible = true;
                        for (var i of cells) {
                            if (_field[i] === 'mine' && _cells[i].attr('data-icon') !== 'flag') {
                                possible = false;
                                break;
                            }
                        }
                        if (possible) {
                            for (var i of cells) {
                                if (_cells[i].is('[data-concealed]') && _cells[i].attr('data-icon') !== 'flag') {
                                    _revealCell(i);
                                }
                            }
                        }
                        break;
                }
            }

            _clickTarget = -1;
            _clickButton = 0;
        }

        e.preventDefault();
    };

    var _contextmenuHandler = function (e) {
        e.preventDefault();
    };

    this.padNumber = function (number, len) {
        var str = String(number);
        while (str.length < len) {
            str = '0' + str;
        }
        return str;
    };

    this.newGame = function (cols, rows, mines) {
        _field = new Array(cols * rows);
        _field.fill(0);
        _cols = cols;
        _rows = rows;
        _mines = mines;

        var i;
        for (var m = 0; m < mines; m++) {
            do {
                i = Math.floor(Math.random() * _field.length);
            } while (_field[i] === 'mine');

            _field[i] = 'mine';
            for (i of _getAdjacentCells(i)) {
                if (_field[i] !== 'mine') {
                    _field[i]++;
                }
            }
        }

        _fieldElem.html('');
        _cells = new Array(cols * rows);
        i = 0;
        for (var r = 0; r < rows; r++) {
            var rowElem = $('<div class="row"></div>');
            for (var c = 0; c < cols; c++) {
                _cells[i] = $('<div class="cell" data-concealed></div>').mousedown(i, _mouseDownHandler).mouseup(i, _mouseUpHandler).contextmenu(_contextmenuHandler);
                rowElem.append(_cells[i]);
                i++;
            }
            _fieldElem.append(rowElem);
        }

        _fieldsToReveal = cols * rows - mines;

        _mineCounter = mines;
        _mineCounterElem.html(this.padNumber(_mineCounter, 3));

        _timeCounter = 0;
        _timeCounterElem.html(this.padNumber(_timeCounter, 3));
        if (_timeIntervalId !== -1) {
            window.clearInterval(_timeIntervalId);
            _timeIntervalId = -1;
        }

        _newgameButton.attr('data-status', 'playing');

        var additionalStyles = [];

        _wrapper.attr('data-cols', cols);
        if (typeof _columnStyles[cols] === 'undefined') {
            additionalStyles.push('#minesweeper[data-cols="' + cols + '"] .field .row .cell { width: calc((100% / ' + cols + ') - 2px); padding-bottom: calc((100% / ' + cols + ') - 2px); }');
            additionalStyles.push('#minesweeper[data-cols="' + cols + '"][data-scaleby=width] .field .row .cell[data-icon=number]::before {font-size: calc((100vw - 4rem) / ' + cols + ' - 0.25rem); }');
            _columnStyles[cols] = true;
        }

        var resolutionStr = String(cols / rows);
        _wrapper.attr('data-res', resolutionStr);
        if (typeof _resolutionStyles[resolutionStr] === 'undefined') {
            additionalStyles.push('#minesweeper[data-res="' + resolutionStr + '"][data-scaleby=height] { width: calc((100vh - 10.75rem) * ' + (cols / rows) + '); }');
            _resolutionStyles[resolutionStr] = true;
        }

        var sizeStr = cols + 'x' + rows;
        if (typeof _sizeStyles[sizeStr] === 'undefined') {
            additionalStyles.push('#minesweeper[data-cols="' + cols + '"][data-res="' + resolutionStr + '"][data-scaleby=height] .field .row .cell[data-icon=number]::before {font-size: calc(((100vh - 10.75rem) * ' + (cols / rows) + ') / ' + cols + ' - 0.25rem); }');
            _sizeStyles[sizeStr] = true;
        }

        if (additionalStyles.length) {
            var styles = '';
            for (var style of additionalStyles) {
                styles += (styles === '' ? '' : ' ') + style;
            }
            $(document.head).append('<style type="text/css">' + styles + '</style>');
        }

        this.active = true;
        _clickTarget = -1;
        _clickButton = 0;
    };

    this.init = function () {
        _wrapper = $('#minesweeper');
        _fieldElem = _wrapper.find('.field');
        _mineCounterElem = _wrapper.find('.info .mines .numbers');
        _timeCounterElem = _wrapper.find('.info .time .numbers');
        _newgameButton = _wrapper.find('.newgameButton');
        _newgameButton.click(function () {
            var modal = $('<div class="modal"><h2>' + minesweeper.languages[_curLanguage].newGame + '</h2></div>');
            var controls = $('<div class="buttonRow"></div>');
            controls.append($('<button>' + minesweeper.languages[_curLanguage].easy + '</button>').click(function () {
                modalContainer.remove();
                minesweeper.newGame(9, 9, 10);
            }));
            controls.append($('<button>' + minesweeper.languages[_curLanguage].medium + '</button>').click(function () {
                modalContainer.remove();
                minesweeper.newGame(20, 15, 40);
            }));
            controls.append($('<button>' + minesweeper.languages[_curLanguage].hard + '</button>').click(function () {
                modalContainer.remove();
                minesweeper.newGame(32, 24, 120);
            }));
            modal.append(controls);
            var form = $('<form><label>' + minesweeper.languages[_curLanguage].cols + '<input type="number" class="cols" value="' + _cols + '"/></label><label>' + minesweeper.languages[_curLanguage].rows + '<input type="number" class="rows" value="' + _rows + '"/></label><label>' + minesweeper.languages[_curLanguage].mines + '<input type="number" class="mines" value="' + _mines + '"/></label><button type="submit">' + minesweeper.languages[_curLanguage].custom + '</button></form>').submit(function (e) {
                var cols = parseInt($(this).find('.cols').val());
                var rows = parseInt($(this).find('.rows').val());
                var mines = parseInt($(this).find('.mines').val());
                if (typeof cols === 'number' && cols > 0 && typeof rows === 'number' && rows > 0 && typeof mines === 'number' && mines > 0 && mines < cols * rows) {
                    modalContainer.remove();
                    minesweeper.newGame(cols, rows, mines);
                }
                e.preventDefault();
            });
            form.find('INPUT, [type=submit]').keydown(function (e) {
                if (e.which === 13) {
                    form.submit();
                    e.preventDefault();
                }
            });
            modal.append(form);
            var modalContainer = $('<div class="modalContainer"></div>').append(modal).click(function (e) {
                if (e.pageX < modal.offset().left || e.pageX > modal.offset().left + modal.outerWidth() || e.pageY < modal.offset().top || e.pageY > modal.offset().top + modal.outerHeight()) {
                    modalContainer.remove();
                }
            });
            $(document.body).append(modalContainer);
        });

        if (_curLanguage === '') {
            var lang = window.navigator.language.substr(0, 2).toLowerCase();
            if (typeof this.languages[lang] !== 'undefined') {
                this.applyLanguage(lang);
            } else {
                this.applyLanguage('en');
            }
        }

        this.newGame(32, 24, 120);

        $(window).resize(function () {
            if ($(window).innerWidth() / ($(window).innerHeight() - 100) >= _cols / _rows) {
                _wrapper.attr('data-scaleby', 'height');
            } else {
                _wrapper.attr('data-scaleby', 'width');
            }
        }).resize();
    };
}(jQuery);
