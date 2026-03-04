FROM node:18
# الانتقال للمجلد الذي يحتوي على ملفات المشروع الفعلية
WORKDIR /app/Student-System-Enhance
COPY Student-System-Enhance/package*.json ./
RUN npm install
COPY Student-System-Enhance/ .
RUN npm run build
CMD ["npm", "start"]