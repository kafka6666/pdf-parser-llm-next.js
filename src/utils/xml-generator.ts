import { z } from 'zod';
import { LCDataSchema } from './xml-validator';

export const generateXML = (data: z.infer<typeof LCDataSchema>): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<LCData>
  <LCAF_ID>${data.LCAF_ID}</LCAF_ID>
  <LC_ID>${data.LC_ID}</LC_ID>
  <ADSCODE>${data.ADSCODE}</ADSCODE>
  <LC_YEAR>${data.LC_YEAR}</LC_YEAR>
  <LC_NATURE>${data.LC_NATURE}</LC_NATURE>
  <LC_SERIAL>${data.LC_SERIAL}</LC_SERIAL>
  <LC_DATE>${data.LC_DATE}</LC_DATE>
  <CURRENCY>${data.CURRENCY}</CURRENCY>
  <LC_AMOUNT>${data.LC_AMOUNT}</LC_AMOUNT>
  <LC_EXPIRY_DATE>${data.LC_EXPIRY_DATE}</LC_EXPIRY_DATE>
  <LC_EXPIRY_PLACE>${data.LC_EXPIRY_PLACE}</LC_EXPIRY_PLACE>
  <TRANSHIPMENT_YN>${data.TRANSHIPMENT_YN}</TRANSHIPMENT_YN>
  <PARTIAL_YN>${data.PARTIAL_YN}</PARTIAL_YN>
  <COUNTRY>${data.COUNTRY}</COUNTRY>
  <DEST_COUNTRY>${data.DEST_COUNTRY}</DEST_COUNTRY>
  ${data.BANK_REFNO ? `<BANK_REFNO>${data.BANK_REFNO}</BANK_REFNO>` : ''}
  <LOAD_ID>${data.LOAD_ID}</LOAD_ID>
  <EntryDate>${data['Entry Date']}</EntryDate>
  <FinalY>
    <N>${data['Final Y'].N}</N>
  </FinalY>
</LCData>`;
};

export const yourXSDSchema = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="LCData">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="LCAF_ID" type="xs:integer"/>
        <xs:element name="LC_ID" type="xs:string"/>
        <xs:element name="ADSCODE" type="xs:string"/>
        <xs:element name="LC_YEAR" type="xs:string"/>
        <xs:element name="LC_NATURE" type="xs:string"/>
        <xs:element name="LC_SERIAL" type="xs:string"/>
        <xs:element name="LC_DATE" type="xs:string"/>
        <xs:element name="CURRENCY" type="xs:string"/>
        <xs:element name="LC_AMOUNT" type="xs:decimal"/>
        <xs:element name="LC_EXPIRY_DATE" type="xs:string"/>
        <xs:element name="LC_EXPIRY_PLACE" type="xs:string"/>
        <xs:element name="TRANSHIPMENT_YN" type="xs:string"/>
        <xs:element name="PARTIAL_YN" type="xs:string"/>
        <xs:element name="COUNTRY" type="xs:string"/>
        <xs:element name="DEST_COUNTRY" type="xs:string"/>
        <xs:element name="BANK_REFNO" type="xs:string" minOccurs="0"/>
        <xs:element name="LOAD_ID" type="xs:integer"/>
        <xs:element name="EntryDate" type="xs:string"/>
        <xs:element name="FinalY">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="N" type="xs:string"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;