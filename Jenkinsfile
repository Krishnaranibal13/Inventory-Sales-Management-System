pipeline {

    agent any

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Copy Environment File') {
            steps {
                echo 'Copying .env file...'
                sh '''
                    cp /home/ubuntu/Inventory-Sales-Management-System/.env .env
                    chmod 600 .env
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Building Docker images...'
                sh 'docker compose build'
            }
        }

        stage('Stop Old Containers') {
            steps {
                echo 'Stopping old containers...'
                sh 'docker compose down'
            }
        }

        stage('Deploy Application') {
            steps {
                echo 'Starting application...'
                sh 'docker compose up -d'
            }
        }

        stage('Verify Deployment') {
            steps {
                echo 'Checking running containers...'
                sh 'docker compose ps'
            }
        }
    }

    post {
        success {
            echo 'Deployment completed successfully!'
        }

        failure {
            echo 'Deployment failed. Check the Jenkins console output.'
        }
    }
}
