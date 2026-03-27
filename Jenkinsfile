pipeline {
    agent any
    environment {
        DOCKER_IMAGE = 'rajkumar0610/hotel-backend'
        DOCKER_TAG = "${BUILD_NUMBER}"
    }
    stages {
        stage('Checkout') {
            steps {
                echo 'Pulling source code from GitHub...'
                git branch: 'main',
                    url: 'https://github.com/Yash2471999/hotel-backend.git'
            }
        }
        stage('Install Dependencies') {
            steps {
                echo 'Installing npm packages...'
                sh 'npm install'
            }
        }
        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
                sh "docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest"
                echo 'Docker image built!'
            }
        }
        stage('Push to DockerHub') {
            steps {
                echo 'Pushing image to DockerHub...'
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'docker login -u $DOCKER_USER -p $DOCKER_PASS'
                    sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
                    sh "docker push ${DOCKER_IMAGE}:latest"
                }
                echo 'Image pushed to DockerHub!'
            }
        }
        stage('Deploy Container') {
            steps {
                echo 'Deploying backend container...'
                sh 'docker stop hotel-backend || true'
                sh 'docker rm hotel-backend || true'
                sh "docker run -d --name hotel-backend -p 5000:5000 ${DOCKER_IMAGE}:latest"
                echo 'Hotel Backend deployed!'
                sh 'docker ps'
            }
        }
    }
    post {
        success {
            echo 'Backend Pipeline completed successfully!'
        }
        failure {
            echo 'Backend Pipeline failed!'
        }
        always {
            cleanWs()
        }
    }
}
