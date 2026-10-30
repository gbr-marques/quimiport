type DadosLog = Record<string, unknown>;

const cores = {
  reset: '\u001b[0m',
  timestamp: '\u001b[36m',
  info: '\u001b[32m',
  error: '\u001b[31m',
  mensagem: '\u001b[96m',
  chave: '\u001b[34m',
  texto: '\u001b[37m',
  numero: '\u001b[33m',
  booleano: '\u001b[35m',
  pontuacao: '\u001b[90m',
};

class Logger {
  info(dados: DadosLog, mensagem: string): void {
    this.gravar('info', dados, mensagem);
  }

  error(dados: DadosLog, mensagem: string): void {
    this.gravar('error', dados, mensagem);
  }

  private gravar(
    nivel: 'info' | 'error',
    dados: DadosLog,
    mensagem: string,
  ): void {
    const usarCores =
      process.env.NO_COLOR === undefined &&
      (nivel === 'error' ? process.stderr.isTTY : process.stdout.isTTY);
    const data = new Date();
    const timestamp = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')} ${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}:${String(data.getSeconds()).padStart(2, '0')}.${String(data.getMilliseconds()).padStart(3, '0')}`;
    const colorir = (texto: string, cor: string): string =>
      usarCores ? `${cor}${texto}${cores.reset}` : texto;
    const json = JSON.stringify(dados).replace(
      /"(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}[\],:]/g,
      (token) => {
        if (token.startsWith('"')) {
          return colorir(
            token,
            /^"(?:\\.|[^"\\])*"(?=\s*:)/.test(token)
              ? cores.chave
              : cores.texto,
          );
        }
        if (token === 'true' || token === 'false' || token === 'null') {
          return colorir(token, cores.booleano);
        }
        if (/^-?\d/.test(token)) return colorir(token, cores.numero);
        return colorir(token, cores.pontuacao);
      },
    );
    const linha = `${colorir(`[${timestamp}]`, cores.timestamp)} ${colorir(nivel.toUpperCase(), cores[nivel])}: ${colorir(mensagem, cores.mensagem)} ${json}`;

    if (nivel === 'error') {
      console.error(linha);
      return;
    }

    console.info(linha);
  }
}

export const logger = new Logger();
