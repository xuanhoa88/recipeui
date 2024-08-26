import React from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./styles.module.css";

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          <img src={useBaseUrl("/img/app.png")} />
        </div>
      </div>
    </section>
  );
}
