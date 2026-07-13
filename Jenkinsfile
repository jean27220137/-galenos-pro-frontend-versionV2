pipeline {
  agent any

  environment {
    SERVICE_NAME = 'frontend'
    SONAR_KEY    = 'galenos-pro-frontend'
  }

  options {
    timeout(time: 20, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '10'))
    disableConcurrentBuilds()
    timestamps()
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        sh 'npm ci --legacy-peer-deps'
      }
    }

    stage('Test y Cobertura') {
      steps {
        sh 'npm run test:coverage'
      }
    }

    stage('Análisis SonarQube') {
      steps {
        withSonarQubeEnv('SonarQube-Galenos') {
          script {
            def scannerHome = tool 'SonarScanner'
            sh """
              ${scannerHome}/bin/sonar-scanner \
                -Dsonar.projectKey=galenos-pro-frontend \
                -Dsonar.projectName='Galenos Pro Frontend' \
                -Dsonar.sources=src/app \
                -Dsonar.exclusions=**/*.spec.ts,**/environments/** \
                -Dsonar.javascript.lcov.reportPaths=coverage/frontend-galenos-pro/lcov.info \
                -Dsonar.coverage.exclusions=**/app.config.ts,**/app.routes.ts,**/core/models/** \
                -Dsonar.host.url=http://galenos-sonarqube:9000 \
                -Dsonar.login=${env.SONAR_AUTH_TOKEN}
            """
          }
        }
      }
    }

    stage('Quality Gate') {
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

    stage('Build Producción') {
      steps {
        sh 'npm run build'
      }
    }

  }

  post {
    success {
      echo 'Frontend aprobado — build listo para despliegue'
    }
    failure {
      echo 'Pipeline fallido — corregir antes de hacer push'
    }
    always {
      cleanWs(cleanWhenAborted: true, cleanWhenFailure: false, cleanWhenSuccess: true)
    }
  }
}
