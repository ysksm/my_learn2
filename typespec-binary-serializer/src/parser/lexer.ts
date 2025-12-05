/**
 * TypeSpec字句解析器 (Lexer)
 */

export enum TokenType {
  // キーワード
  Namespace = 'NAMESPACE',
  Model = 'MODEL',
  Enum = 'ENUM',

  // リテラル
  Identifier = 'IDENTIFIER',
  Number = 'NUMBER',
  String = 'STRING',

  // 記号
  LeftBrace = 'LEFT_BRACE',
  RightBrace = 'RIGHT_BRACE',
  LeftParen = 'LEFT_PAREN',
  RightParen = 'RIGHT_PAREN',
  LeftBracket = 'LEFT_BRACKET',
  RightBracket = 'RIGHT_BRACKET',
  Colon = 'COLON',
  Semicolon = 'SEMICOLON',
  Comma = 'COMMA',
  At = 'AT',
  Question = 'QUESTION',

  // 特殊
  Comment = 'COMMENT',
  DocComment = 'DOC_COMMENT',
  Newline = 'NEWLINE',
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export class Lexer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(source: string) {
    this.source = source;
  }

  private peek(offset: number = 0): string {
    return this.source[this.pos + offset] || '';
  }

  private advance(): string {
    const char = this.source[this.pos++];
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  private skipWhitespace(): void {
    while (this.pos < this.source.length) {
      const char = this.peek();
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else if (char === '\n') {
        this.advance();
      } else {
        break;
      }
    }
  }

  private readString(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    const quote = this.advance(); // " または '
    let value = '';

    while (this.pos < this.source.length && this.peek() !== quote) {
      if (this.peek() === '\\') {
        this.advance();
        const escaped = this.advance();
        switch (escaped) {
          case 'n': value += '\n'; break;
          case 't': value += '\t'; break;
          case 'r': value += '\r'; break;
          case '\\': value += '\\'; break;
          case '"': value += '"'; break;
          case "'": value += "'"; break;
          default: value += escaped;
        }
      } else {
        value += this.advance();
      }
    }

    if (this.peek() === quote) {
      this.advance();
    }

    return { type: TokenType.String, value, line: startLine, column: startColumn };
  }

  private readNumber(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';

    // 16進数チェック
    if (this.peek() === '0' && (this.peek(1) === 'x' || this.peek(1) === 'X')) {
      value += this.advance(); // 0
      value += this.advance(); // x
      while (/[0-9a-fA-F]/.test(this.peek())) {
        value += this.advance();
      }
    } else {
      // 10進数
      while (/[0-9]/.test(this.peek())) {
        value += this.advance();
      }
      // 小数部
      if (this.peek() === '.' && /[0-9]/.test(this.peek(1))) {
        value += this.advance(); // .
        while (/[0-9]/.test(this.peek())) {
          value += this.advance();
        }
      }
    }

    return { type: TokenType.Number, value, line: startLine, column: startColumn };
  }

  private readIdentifier(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';

    while (/[a-zA-Z0-9_]/.test(this.peek())) {
      value += this.advance();
    }

    // キーワードチェック
    let type: TokenType;
    switch (value) {
      case 'namespace': type = TokenType.Namespace; break;
      case 'model': type = TokenType.Model; break;
      case 'enum': type = TokenType.Enum; break;
      default: type = TokenType.Identifier;
    }

    return { type, value, line: startLine, column: startColumn };
  }

  private readComment(): Token | null {
    const startLine = this.line;
    const startColumn = this.column;

    if (this.peek() === '/' && this.peek(1) === '/') {
      this.advance(); // /
      this.advance(); // /

      let value = '';

      // ドキュメントコメントかチェック
      const isDocComment = this.peek() === '/';
      if (isDocComment) {
        this.advance(); // 3番目の /
      }

      // 行末まで読む
      while (this.pos < this.source.length && this.peek() !== '\n') {
        value += this.advance();
      }

      return {
        type: isDocComment ? TokenType.DocComment : TokenType.Comment,
        value: value.trim(),
        line: startLine,
        column: startColumn
      };
    }

    if (this.peek() === '/' && this.peek(1) === '*') {
      this.advance(); // /
      this.advance(); // *

      let value = '';
      const isDocComment = this.peek() === '*' && this.peek(1) !== '/';
      if (isDocComment) {
        this.advance(); // *
      }

      while (this.pos < this.source.length) {
        if (this.peek() === '*' && this.peek(1) === '/') {
          this.advance(); // *
          this.advance(); // /
          break;
        }
        value += this.advance();
      }

      return {
        type: isDocComment ? TokenType.DocComment : TokenType.Comment,
        value: value.trim(),
        line: startLine,
        column: startColumn
      };
    }

    return null;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.source.length) {
      this.skipWhitespace();

      if (this.pos >= this.source.length) break;

      const char = this.peek();
      const startLine = this.line;
      const startColumn = this.column;

      // コメント
      if (char === '/') {
        const comment = this.readComment();
        if (comment) {
          if (comment.type === TokenType.DocComment) {
            tokens.push(comment);
          }
          continue;
        }
      }

      // 文字列
      if (char === '"' || char === "'") {
        tokens.push(this.readString());
        continue;
      }

      // 数値
      if (/[0-9]/.test(char)) {
        tokens.push(this.readNumber());
        continue;
      }

      // 識別子・キーワード
      if (/[a-zA-Z_]/.test(char)) {
        tokens.push(this.readIdentifier());
        continue;
      }

      // 記号
      switch (char) {
        case '{':
          tokens.push({ type: TokenType.LeftBrace, value: char, line: startLine, column: startColumn });
          this.advance();
          break;
        case '}':
          tokens.push({ type: TokenType.RightBrace, value: char, line: startLine, column: startColumn });
          this.advance();
          break;
        case '(':
          tokens.push({ type: TokenType.LeftParen, value: char, line: startLine, column: startColumn });
          this.advance();
          break;
        case ')':
          tokens.push({ type: TokenType.RightParen, value: char, line: startLine, column: startColumn });
          this.advance();
          break;
        case '[':
          tokens.push({ type: TokenType.LeftBracket, value: char, line: startLine, column: startColumn });
          this.advance();
          break;
        case ']':
          tokens.push({ type: TokenType.RightBracket, value: char, line: startLine, column: startColumn });
          this.advance();
          break;
        case ':':
          tokens.push({ type: TokenType.Colon, value: char, line: startLine, column: startColumn });
          this.advance();
          break;
        case ';':
          tokens.push({ type: TokenType.Semicolon, value: char, line: startLine, column: startColumn });
          this.advance();
          break;
        case ',':
          tokens.push({ type: TokenType.Comma, value: char, line: startLine, column: startColumn });
          this.advance();
          break;
        case '@':
          tokens.push({ type: TokenType.At, value: char, line: startLine, column: startColumn });
          this.advance();
          break;
        case '?':
          tokens.push({ type: TokenType.Question, value: char, line: startLine, column: startColumn });
          this.advance();
          break;
        default:
          this.advance(); // 未知の文字はスキップ
      }
    }

    tokens.push({ type: TokenType.EOF, value: '', line: this.line, column: this.column });
    return tokens;
  }
}
