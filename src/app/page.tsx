import Link from "next/link";
import { Manrope } from "next/font/google";
import styles from "./_landing/landing.module.css";
import LandingSlider from "./_landing/LandingSlider";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });

export default function HomePage() {
  return (
    <div className={`${styles.page} ${manrope.className}`}>
      <div className={styles.bg} />
      <div className={styles.grain} />

      <Header />

      <main className={styles.wrap}>
        <section className={styles.hero}>
          <div>
            <div className={styles.pill}>
              <i className={styles.pillDot} />
              <span>Equipos · Ligas · Peñas</span>
            </div>

            <h1 className={styles.h1}>
              Organiza, juega y <span className={styles.grad}>cuadra cuentas</span>.
            </h1>

            <p className={styles.lead}>
              GRUPLY reúne todo lo del grupo: quedadas, resultados y gastos, con una experiencia rápida y bonita.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              {/* ✅ En una app real: entrar/crear cuenta siempre va a /login */}
              <Link className={`${styles.btn} ${styles.primary}`} href="/login">
                Entrar
              </Link>
              <Link className={styles.btn} href="/login">
                Crear grupo
              </Link>
            </div>
          </div>

          <div>
            <div className={styles.heroCard}>
              <div className={styles.heroRow}>
                <div className={styles.badge}>✨</div>
                <div>
                  <strong>Menos chat. Más acción.</strong>
                  <span>Todo lo importante del grupo queda ordenado: quién viene, quién gana y quién paga.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <LandingSlider />

        <section className={styles.features}>
          <h3>Lo esencial para un grupo deportivo.</h3>
          <p>Organizar, quedar, competir y repartir gastos: lo justo, rápido y bonito.</p>

          <div className={styles.featGrid}>
            <div className={styles.feat}>
              <div className={styles.ic}>📅</div>
              <div>
                <b>Grupos</b>
                <span>Roles e invitaciones.</span>
              </div>
            </div>
            <div className={styles.feat}>
              <div className={styles.ic}>💶</div>
              <div>
                <b>Eventos</b>
                <span>Asistencia + recordatorios.</span>
              </div>
            </div>
            <div className={styles.feat}>
              <div className={styles.ic}>🏆</div>
              <div>
                <b>Ligas</b>
                <span>Ranking y resultados.</span>
              </div>
            </div>
            <div className={styles.feat}>
              <div className={styles.ic}>👥</div>
              <div>
                <b>Finanzas</b>
                <span>Cuotas y gastos.</span>
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <span>GRUPLY · landing marketing</span>
            <span>Desliza ← o usa flechas</span>
          </div>
        </section>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.brand}>
          <div className={styles.mark}>G</div>
          <div className={styles.brandTxt}>
            <strong>GRUPLY</strong>
            <span id="hint">Organiza tu grupo en minutos</span>
          </div>
        </div>

        <div className={styles.headerBtns}>
          <InstallButton />
          <Link className={`${styles.btn} ${styles.primary}`} href="/login">
            Entrar
          </Link>
        </div>
      </div>
    </header>
  );
}

function InstallButton() {
  // Client-only mini widget sin crear otro archivo: Next lo renderiza como server.
  // Si quieres, lo convertimos en componente "use client" y lo hacemos funcional.
  return (
    <button className={`${styles.btn} ${styles.disabled}`} id="installBtn" type="button">
      ✨ Instalar
    </button>
  );
}
