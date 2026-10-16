import { BRAND_NAME } from "@/lib/site";
import styles from "./site.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <p className={styles.brand}>{BRAND_NAME}</p>
      <h1 className={styles.title}>Convite não encontrado</h1>
      <p className={styles.text}>
        Este endereço não corresponde a um convite disponível. Confira o link recebido ou fale com quem enviou o
        convite.
      </p>
    </main>
  );
}
