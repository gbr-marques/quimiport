export abstract class ErroDominio extends Error {
  constructor(
    readonly codigo: string,
    mensagem: string,
    readonly regra?: string,
    readonly detalhes?: unknown,
  ) {
    super(mensagem);
    this.name = new.target.name;
  }
}

/** Dado que viola uma invariante do domínio (HTTP 400) */
export class ErroValidacao extends ErroDominio {}

/** Registro inexistente (HTTP 404) */
export class ErroNaoEncontrado extends ErroDominio {}

/** Duplicidade, como nome de produto ou código de carga (HTTP 409) */
export class ErroConflito extends ErroDominio {}

/** Regra de negócio ou transição de status inválida (HTTP 422) */
export class ErroRegraNegocio extends ErroDominio {}
